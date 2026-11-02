import type {DocumentConcepts, TopConceptTerm} from '../../types'

/**
 * A concept crossing the boundary between a scheme's top concepts and its plain
 * ones. `isTopConcept` is the state being moved *to*, matching the plan in
 * `core/mutations`.
 */
export type TopConceptChange = {conceptId: string; isTopConcept: boolean}

/**
 * #### Set Top Concept In Tree
 * Promote a root orphan to a top concept, or demote a top concept back, in the
 * rendered tree — ahead of the live listener catching up with the scheme patch.
 *
 * Both directions are a root-level move: the row leaves one of the tree's two
 * root lists and joins the other, keeping whatever hangs under it. Nothing
 * nested changes, because only a concept with no broader term in this scheme
 * can be promoted, and a top concept has none by definition.
 *
 * A demoted concept is marked `isOrphan`, which is what the query will say
 * about it too: `trunkBuilder` flags a member with no in-scheme broader term,
 * and `rootOrphans` is what puts it back at the root.
 *
 * Same contract as `pruneConcepts` and `moveConcept`: the input is never
 * mutated, and the same reference comes back when there is nothing to do — so a
 * change that has already landed, or names a concept that is not where it was,
 * costs no re-render.
 */
export function setTopConceptInTree(
  data: DocumentConcepts | null,
  change: TopConceptChange,
): DocumentConcepts | null {
  if (!data) return null

  return change.isTopConcept ? promote(data, change.conceptId) : demote(data, change.conceptId)
}

function promote(data: DocumentConcepts, conceptId: string): DocumentConcepts {
  // Only a root orphan can be promoted. A member rendered under a broader term
  // is in `concepts` too, so the `isOrphan` check is what distinguishes them.
  const concept = data.concepts.find((node) => node.id === conceptId && node.isOrphan)
  if (!concept) return data

  const {isOrphan: _isOrphan, level: _level, ...asTopConcept} = concept

  return {
    topConcepts: insertInOrder(data.topConcepts, asTopConcept as TopConceptTerm),
    concepts: data.concepts.filter((node) => node.id !== conceptId),
  }
}

function demote(data: DocumentConcepts, conceptId: string): DocumentConcepts {
  const concept = data.topConcepts.find((node) => node.id === conceptId)
  if (!concept) return data

  return {
    topConcepts: data.topConcepts.filter((node) => node.id !== conceptId),
    concepts: insertInOrder(data.concepts, {...concept, isOrphan: true, level: 0}),
  }
}

/** Alphabetical by `prefLabel`, matching the `|order(prefLabel)` in the query. */
function insertInOrder<T extends {prefLabel: string}>(nodes: T[], node: T): T[] {
  const at = nodes.findIndex((sibling) => sibling.prefLabel.localeCompare(node.prefLabel) > 0)
  if (at === -1) return [...nodes, node]
  return [...nodes.slice(0, at), node, ...nodes.slice(at)]
}

/**
 * Whether fresh data already reflects the change, so the optimistic replay can
 * stop — otherwise the concept would be moved a second time on top of the
 * listener's own result. Mirrors `isMoveApplied`.
 *
 * A promotion is watched for by arrival among the top concepts; a demotion by
 * departure from them. Either way `null` data reports false, so a pending
 * change is never dropped before there is anything to check it against.
 */
export function isTopConceptApplied(
  data: DocumentConcepts | null,
  change: TopConceptChange,
): boolean {
  if (!data) return false
  const isTop = data.topConcepts.some((node) => node.id === change.conceptId)
  return change.isTopConcept ? isTop : !isTop
}
