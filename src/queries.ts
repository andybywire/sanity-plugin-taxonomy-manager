/**
 * ### Tree Builder
 * Recursive function to build out successive branches of the hierarchy
 * up to five levels deep.
 */

/**
 * #### Branch Builder
 * Recursive function to build out successive branches of the hierarchy
 * up to five levels deep.
 */
const branchBuilder = (level = 1): string | void => {
  let reference = '^.^.concepts[]._ref'
  let i = 1
  while (level > i) {
    reference = `^.${reference}`
    i++
  }
  if (level > 6) {
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
      "topConcepts":*[_type == "skosConcept" && conceptId == $branchId]{
        "id": _id,
        "level": 0,
        _originalId,
        prefLabel,
        definition,
        example,
        scopeNote,
        ${branchBuilder() || ''}  
      }, 
      "concepts": []
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
