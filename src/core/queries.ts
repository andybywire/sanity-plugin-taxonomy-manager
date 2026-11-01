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
