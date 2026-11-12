/**
 * Maximum hierarchy depth the builders recurse to. This is the single knob for
 * the depth cap — raising it later (if performance permits and use cases
 * warrant) is a one-line change. Kept at its long-standing value of 6.
 */
const MAX_TREE_DEPTH = 6

/**
 * #### Branch Builder
 * Recursive builder for successive branches of the concept hierarchy, down to
 * `MAX_TREE_DEPTH` levels deep.
 */
const branchBuilder = (level = 1): string | void => {
  let reference = '^.^.concepts[]._ref'
  let i = 1
  while (level > i) {
    reference = `^.${reference}`
    i++
  }
  if (level > MAX_TREE_DEPTH) {
    return ''
  }
  return `"childConcepts": *[_id in ${reference} && ^._id in broader[]._ref]|order(prefLabel)
     {
      "id": _id,
      "level": ${level},
      _originalId,
      prefLabel,
      definition,
      example,
      scopeNote,
      ${branchBuilder(level + 1) || ''}
    }`
}

/**
 * #### Trunk Builder
 * Fetch the top concepts, their child concepts, and orphan concepts
 * and their child concepts.
 *
 * To get orphans:
 * - filter to concepts in this scheme only
 * - filter out concepts that reference a topConcept in this scheme as
 *   a broader term
 * - filter out concepts that reference other concepts in this scheme
 *   as a broader term
 *
 * Used in Hierarchy.tsx
 */
export const trunkBuilder = (): string => {
  return `*[_id == $id][0] {
    _updatedAt,
    "topConcepts": topConcepts[]->|order(prefLabel) {
      "id": _id,
      "level": 0,
      _originalId,
      prefLabel,
      definition,
      example,
      scopeNote,
      ${branchBuilder() || ''}
    },
    "concepts": concepts[]->|order(prefLabel) {
      "id": _id,
      "level": 0,
      "isOrphan": 
        coalesce(
          !array::intersects(
            broader[]._ref, (
              coalesce(^.concepts[]._ref, []) + coalesce(^.topConcepts[]._ref, [])
            )
          ),
        true),
      _originalId,
      prefLabel,
      definition,
      example,
      scopeNote,
      ${branchBuilder() || ''}
    }
  }`
}

/**
 * #### Input Builder
 * Accept a branchId parameter, and filter to topConcepts and Concepts
 * in that branch only. Then call branchBuilder recursively — it will
 * only build terms in the scheme referenced by that concept.
 *
 * - trunkBuilder() is called in Hierarchy.tsx
 * - inputBuilder() is called in InputHierarchy.tsx
 */
export const inputBuilder = (): string => {
  return `
  select($branchId != null => 
    *[_id == $id][0] {
      _updatedAt,
      "concepts": concepts[$branchId in @->broader[]->.conceptId]->|order(prefLabel) {
        "id": _id,
        "level": 0,
        "isOrphan": true,
        _originalId,
        prefLabel,
        definition,
        example,
        scopeNote,
        ${branchBuilder() || ''}
      }
    },
    *[_id == $id][0] {
      _updatedAt,
      "topConcepts":topConcepts[]->|order(prefLabel){
        "id": _id,
        "level": 0,
        _originalId,
        prefLabel,
        definition,
        example,
        scopeNote,
        ${branchBuilder() || ''}
      }, 
      "concepts": concepts[]->|order(prefLabel){
        "id": _id,
        "level": 0,
        "isOrphan": 
          coalesce(
            !array::intersects(
              broader[]._ref, (
                coalesce(^.concepts[]._ref, []) + coalesce(^.topConcepts[]._ref, [])
              )
            ), 
          true),
        _originalId,
        prefLabel,
        definition,
        example,
        scopeNote,
        ${branchBuilder() || ''}
      }
    }
  )`
}

/**
 * #### Published Concepts Builder
 * The ids, among those asked about, that exist as published documents.
 *
 * A second query rather than a field on the tree: GROQ cannot see outside the
 * perspective it runs under, and the tree runs under `drafts`, where every
 * concept resolves whether or not it was ever published. Run this one under
 * `published` and membership is the answer.
 *
 * Both halves are scoped to `$ids` — the ids the tree is actually showing —
 * so the listener wakes only for concepts on screen, and not at all while the
 * markers are gated off and the list is empty.
 */
export const publishedConceptsBuilder = (): {fetch: string; listen: string} => ({
  fetch: `*[_type == "skosConcept" && _id in $ids]._id`,
  listen: `*[_type == "skosConcept" && _id in $ids]`,
})

/**
 * #### Tagged Resource Filter
 * What counts as a resource tagged with a concept: any document that is
 * neither part of the taxonomy itself nor one of Sanity's own system
 * documents. The single predicate behind both the scheme-wide governance
 * rollup (`conceptUsageBuilder`) and the per-concept list in
 * `views/ConceptUseView`, which answer the same question at two scales and
 * must never disagree about what they are counting.
 *
 * Concepts and schemes are excluded so that `broader` and `related` links are
 * not mistaken for use: a term referenced only by its own narrower terms is
 * unused, and that is exactly what a steward is looking for.
 *
 * **System documents are excluded by `path("_.**")`, not `path("system.**")`.**
 * The usage-query spike recorded the latter, and it matches nothing: system
 * documents carry ids like `_.groups.administrator`, `_.releases.<name>` and
 * `_.schemas.<id>` — under `raw` and under a perspective alike. Measured
 * against the dev dataset, `path("system.**")` excluded 0 of the 14 present
 * and `path("_.**")` excluded all of them. Counts were right only because no
 * system document happened to reference a concept.
 *
 * Written as two `!=` comparisons rather than `!(_type in [...])` because
 * every clause here is then on Sanity's documented list of optimizable filter
 * expressions, and a `count()` is optimizable only when its interior is
 * *completely* optimizable. Both forms were measured to push down to the index
 * today; only this one is documented to.
 */
export const TAGGED_RESOURCE_FILTER =
  '_type != "skosConcept" && _type != "skosConceptScheme" && !(_id in path("_.**"))'

/**
 * #### Concept Usage Builder
 * How many resources are tagged with each of the given concepts — the
 * governance view's rollup.
 *
 * Scoped to `$ids`, the ids the tree is already showing, exactly as
 * `publishedConceptsBuilder` is. An empty list is the off switch: the query
 * matches nothing and the listener never fires.
 *
 * Run under the perspective the tree is rendering, which is what makes the
 * count simple. A perspective already collapses each document to one
 * normalized id, so there is no `array::unique` and no id reconciliation —
 * the complications the `raw` version of this query needed.
 *
 * The projection is the id and the count and nothing else; the tree supplies
 * every label the view draws.
 *
 * On the shape of the count: the planner does **not** run one subquery per
 * term. It unions every id in `$ids` and runs a single indexed fetch, bucketed
 * per term (`HashBatchStep` over `unionFlat`), so term count is cheap and
 * dataset growth does not affect an optimized filter. What is not yet known is
 * how this behaves as reference *density* into one scheme rises: that batched
 * fetch carries no projection, so it appears to materialize matching
 * documents. Projecting `._id` on the inner count does not change the plan.
 */
export const conceptUsageBuilder = (): {fetch: string; listen: string} => ({
  fetch: `*[_type == "skosConcept" && _id in $ids]{
      "id": _id,
      "uses": count(*[${TAGGED_RESOURCE_FILTER} && references(^._id)])
    }`,
  // Narrowed to documents that tag one of these concepts, rather than to every
  // content document, so an unrelated edit does not refetch the rollup. This
  // follows the pattern `ConceptUseView` already ships.
  //
  // The open question was whether a listener scoped this way also fires when a
  // document *stops* matching — a tag being removed, which is the decrement a
  // steward most needs to see. **Observed in the Studio on 2026-11-11: it
  // does.** Counts move in both directions as tags are added and removed
  // elsewhere. Recorded rather than reasoned about, per ADR 0005: the id math
  // said this was doubtful and the dataset says otherwise.
  listen: `*[${TAGGED_RESOURCE_FILTER} && references($ids)]`,
})

/**
 * #### Concept Use Builder
 * The resources tagged with one concept, for `views/ConceptUseView` — the
 * per-concept list the governance rollup aggregates.
 *
 * The same `TAGGED_RESOURCE_FILTER` as `conceptUsageBuilder`, which is the
 * whole point: the two answer one question at two scales, and a steward who
 * opens a term showing 12 and counts 11 rows has no reason to trust either
 * number again. Sharing the predicate is what makes that impossible rather
 * than merely unlikely.
 *
 * Projects what `Preview` needs to render a row and nothing more.
 *
 * The view stays outside the data port (see ADR 0001) and calls
 * `useListeningQuery` itself; only the GROQ is shared.
 */
export const conceptUseBuilder = (): string =>
  `*[${TAGGED_RESOURCE_FILTER} && references($refId)]{_id,_type,title}`

/**
 * How many candidates the insert picker fetches.
 *
 * This is a browse list as much as a search one — an empty query lists what is
 * available rather than nothing — so the cap has to be big enough to be worth
 * scrolling. 147 named concepts sat outside one scheme in the dev dataset, and
 * each row is three short fields, so a hundred costs almost nothing. Past the
 * cap, typing narrows.
 */
export const CONCEPT_SEARCH_LIMIT = 100

/**
 * #### Concept Search Builder
 * Concepts that are *not* members of a scheme, matched by preferred label, for
 * the "insert an existing concept" picker.
 *
 * Run under the drafts perspective, where `_id` comes back normalized to the
 * published id — so the scheme's own published references can be passed
 * straight in as `$excludeIds` with no draft/published reconciliation.
 *
 * The parameter is `$searchQuery`, never `$query`: `query` is a reserved
 * `@sanity/client` `QueryParams` key and fails typecheck cryptically.
 *
 * GROQ `match` is word-based, so "co" matches "A wee childe concept" as well as
 * "Collection". That is ordinary typeahead behavior rather than a prefix match
 * on the whole label. A `$searchQuery` of `*` matches everything, which is how
 * the picker lists what is available before anything is typed.
 *
 * Concepts with no preferred label are left out. They exist — nine of them in
 * the dev dataset — and they sort first, so without this the browse list opens
 * on a run of blank rows that identify nothing.
 *
 * `$allowBroaderInScheme` is false only when picking a **top** concept. SKOS
 * says a top concept has no broader term within its own scheme, so a candidate
 * holding one is not eligible — a broader term in some *other* scheme is fine,
 * and still eligible. Everywhere else the flag is true and the predicate costs
 * nothing: 142 of 147 candidates survived it against one scheme in the dev
 * dataset.
 */
export const conceptSearchBuilder = (): string => {
  return `*[_type == "skosConcept"
    && !(_id in $excludeIds)
    && defined(prefLabel) && prefLabel != ""
    && ($allowBroaderInScheme || !array::intersects(coalesce(broader[]._ref, []), $excludeIds))
    && prefLabel match $searchQuery]
    | order(prefLabel) [0...${CONCEPT_SEARCH_LIMIT}] {
      "id": _id,
      _originalId,
      prefLabel,
      "broaderRefs": broader[]._ref
    }`
}
