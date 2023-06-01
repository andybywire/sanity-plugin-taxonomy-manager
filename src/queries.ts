/**
 * Tree Builder
 * Recursive function to build out successive branches of the hierarchy up to five levels deep.
 * @todo: Detect when a 6th level is present and print a message in the UI.
 */

// Branch Builder
// - Get the prefLabel and _id of each concept in the array of concepts referenced by the broader term
// - Repeat the process for each of those concepts
// - Run tree to a depth of 6 levels. Return 5.
// - If there is a 6th level, do no return it; return a message. (TBD)
const branchBuilder = (level = 1): string | void => {
  if (level > 6) {
    return ''
  }
  return `"childConcepts": *[_id in coalesce(*[_id == 'drafts.' + $id][0], *[_id == $id][0]).concepts[]._ref && ^._id in broader[]._ref ]|order(prefLabel){
      "id": _id,
      "level": ${level},
      prefLabel,
      definition,
      example,
      scopeNote,
      ${branchBuilder(level + 1)}
    }`
}

// Trunk Builder
// Fetch the top concepts and their child concepts and orphans and their child concepts.
// coalesce() returns the first non-null value in the list of arguments, so either the draft or the published concept.
// To get orphans:
// - filter to concepts in this scheme only
// - filter out concepts that reference a topConcept in this scheme as a broader term
// - filter out concepts that reference other concepts in this scheme as a broader term
export const trunkBuilder = (): string => {
  return `coalesce(*[_id == 'drafts.' + $id][0], *[_id == $id][0]) {
    _updatedAt,
    "topConcepts":topConcepts[]->|order(prefLabel){
      "id": _id,
      "level": 0,
      prefLabel,
      definition,
      example,
      scopeNote,
      ${branchBuilder()}
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
      ${branchBuilder()}
    }
  }`
}
