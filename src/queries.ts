/**
 * ### Tree Builder
 * Recursive function to build out successive branches of the hierarchy up to five levels deep.
 */

/**
 * #### Branch Builder
 * For create-in-place of draft documents, branch builder needs to
 * query and display draft versions of documents that are registered
 * in this array as published. Here's how the query works:
 * - get the any "published" document in the .concepts[] array that has
 *   a `drafts.` version, or
 * - get any published document in the .concepts[] array, except those
 *   with a `conceptId` in the "drafts" list. This eliminates returning
 *   both the draft and published versions of the same document.
 * - in both cases, returned documents must have the _id of the parent
 *   of this child in their .broader[] array.
 */
const branchBuilder = (level = 1): string | void => {
  if (level > 6) {
    return ''
  }
  return `"childConcepts": *[
    (
      (
        _id in $draftConceptIds &&
        !(conceptId in *[_id in $conceptIds].conceptId)
      ) 
      ||
      (
        _id in $conceptIds &&
        !(conceptId in $draftConceptIds)
      )
    ) && ^._id in broader[]._ref ]|order(prefLabel){
      "id": _id,
      "level": ${level},
      prefLabel,
      definition,
      example,
      scopeNote,
      ${branchBuilder(level + 1)}
    }`
}
/**
 * #### Input Branch Builder
 * Displays only published concepts
 */
const inputBranchBuilder = (level = 1): string | void => {
  if (level > 6) {
    return ''
  }
  return `"childConcepts": *[_id in *[_id == $id][0].concepts[]._ref && ^._id in broader[]._ref ]|order(prefLabel){
      "id": _id,
      "level": ${level},
      prefLabel,
      definition,
      example,
      scopeNote,
      ${inputBranchBuilder(level + 1)}
    }`
}

/**
 * #### Trunk Builder
 * Fetch the top concepts and their child concepts and orphans and
 * their child concepts. coalesce() returns the first non-null value
 * in the list of arguments, so either the draft or the published concept.
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
    "topConcepts": *[
      (
        _id in $draftTopConceptIds &&
        !(conceptId in *[_id in $topConceptIds].conceptId)
      )
      ||
      (
        _id in $topConceptIds
      )
      ]|order(prefLabel) {
      "id": _id,
      "level": 0,
      prefLabel,
      definition,
      example,
      scopeNote,
      ${branchBuilder()}
    },
    "orphans": *[
      ((
        _id in $draftConceptIds &&
        !(conceptId in *[_id in $conceptIds].conceptId)
      )
      ||
      (
        _id in $conceptIds
      )) &&
      count(
        (broader[]._ref) [@ in coalesce(
          *[_id == 'drafts.' + $id][0], 
          *[_id == $id][0]
        ).topConcepts[]._ref]) < 1 &&
      count(
        (broader[]._ref) [@ in coalesce(
          *[_id == 'drafts.' + $id][0], 
          *[_id == $id][0]
        ).concepts[]._ref]) < 1
    ]|order(prefLabel){
      "id": _id,
      "level": 0,
      prefLabel,
      definition,
      example,
      scopeNote,
      ${branchBuilder()}
    }
  }`
}

/**
 * #### Input Builder
 * Accept a branchId parameter, and filter to topConcepts and Orphans
 * in that branch only. Then call branchBuilder recursively — it will
 * only build terms in the scheme referenced by that concept.
 * - branchBuilder() and inputBuilder() are called in Hierarchy.tsx
 */
export const inputBuilder = (): string => {
  return `
  select($branchId != null => 
    *[_id == $id][0] {
      _updatedAt,
      "topConcepts":*[_type == "skosConcept" && conceptId == $branchId]{
        "id": _id,
        "level": 0,
        prefLabel,
        definition,
        example,
        scopeNote,
        ${inputBranchBuilder()}
      }, 
      "orphans": []
    },
    *[_id == $id][0] {
      _updatedAt,
      "topConcepts":topConcepts[]->|order(prefLabel){
        "id": _id,
        "level": 0,
        prefLabel,
        definition,
        example,
        scopeNote,
        ${inputBranchBuilder()}
      }, 
      "orphans": *[
        _id in coalesce(*[_id == 'drafts.' + $id][0], *[_id == $id][0]).concepts[]._ref &&
        count((broader[]._ref) [@ in coalesce(*[_id == 'drafts.' + $id][0], *[_id == $id][0]).topConcepts[]._ref]) < 1 &&
        count((broader[]._ref) [@ in coalesce(*[_id == 'drafts.' + $id][0], *[_id == $id][0]).concepts[]._ref]) < 1
      ]|order(prefLabel){
        "id": _id,
        "level": 0,
        prefLabel,
        definition,
        example,
        scopeNote,
        ${inputBranchBuilder()}
      }
    }
  )`
}
