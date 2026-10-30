import type {ChildConceptTerm, DocumentConcepts, TopConceptTerm} from '../../types'

/**
 * The deepest level the Tree View renders. `queries.ts` projects to
 * `MAX_TREE_DEPTH`, but `Children` stops recursing at level 5 and flags a node
 * there that still has children, so a term below this is fetched yet invisible.
 */
export const MAX_VISIBLE_LEVEL = 5

/**
 * One occurrence of a concept in the tree. A concept with more than one broader
 * term renders at several points, so a move is identified by the edge — the
 * concept *and* the parent it currently hangs under — not by the concept alone.
 */
export type ConceptMove = {
  conceptId: string
  fromParentId: string
  /** The new broader term, or `null` to drop the broader term altogether. */
  toParentId: string | null
}

/** Whether a move is legal, with a reason to show the editor when it is not. */
export type MoveCheck = {allowed: true} | {allowed: false; reason: string}

/**
 * Decide whether a concept may be re-parented onto another concept, given the
 * tree as currently rendered.
 *
 * Every move this answers for is a single patch to a single concept document:
 * a non-top concept already sits in the scheme's `concepts[]` array, and the
 * children of *any* node — top concepts included — are drawn from that same
 * array, so only the moved concept's `broader` changes. A `null` target drops
 * the broader term rather than replacing it, which the query reads as
 * `isOrphan` and the tree renders at the root; that too touches no scheme
 * field. What does need a second document is moving a *top* concept, whose
 * reference would have to move between `topConcepts[]` and `concepts[]` — the
 * caller excludes it by having no `fromParentId` to offer for a root row.
 *
 * The published-perspective gate is not restated here: edit affordances are not
 * rendered at all when `releaseContext === 'published'`.
 */
export function canMoveConcept({
  data,
  conceptId,
  fromParentId,
  toParentId,
}: {data: DocumentConcepts | null} & ConceptMove): MoveCheck {
  if (!data) {
    return {allowed: false, reason: 'The concept tree has not loaded yet.'}
  }
  if (!isChildOf(data, conceptId, fromParentId)) {
    return {allowed: false, reason: 'This concept is no longer where it was.'}
  }
  // Dropping a broader term can neither cycle nor deepen anything.
  if (toParentId === null) {
    return {allowed: true}
  }
  if (conceptId === toParentId) {
    return {allowed: false, reason: 'A concept cannot be its own broader term.'}
  }
  if (fromParentId === toParentId) {
    return {allowed: false, reason: 'This concept is already here.'}
  }

  const targets = occurrencesOf(data, toParentId)
  if (targets.length === 0) {
    return {allowed: false, reason: 'That broader term is not part of this tree.'}
  }
  if (occurrencesOf(data, conceptId).some((node) => containsDescendant(node, toParentId))) {
    return {
      allowed: false,
      reason: 'A concept cannot be moved beneath one of its own narrower terms.',
    }
  }
  if (isChildOf(data, conceptId, toParentId)) {
    return {allowed: false, reason: 'This concept already has that broader term.'}
  }

  // Worst case on both sides: the target's deepest rendering, and the tallest
  // subtree the concept carries with it.
  const landingLevel = Math.max(...targets.map((node) => node.level ?? 0)) + 1
  const carried = Math.max(...occurrencesOf(data, conceptId).map(heightOf))
  if (landingLevel + carried > MAX_VISIBLE_LEVEL) {
    return {
      allowed: false,
      reason: `That move would push terms past the maximum hierarchy depth of ${MAX_VISIBLE_LEVEL} levels.`,
    }
  }

  return {allowed: true}
}

/**
 * Re-parent one occurrence of a concept, returning a new tree without mutating
 * the input. Passes `null` through and returns the same reference when the
 * concept is no longer under the parent the move names.
 *
 * Used by the optimistic layer in `Hierarchy`, exactly as `pruneConcepts` is: it
 * mirrors what the live listener will return once the `broader` patch lands, so
 * the tree re-draws immediately instead of waiting on a full-trunk refetch.
 * Siblings are kept in `prefLabel` order to match the query's `|order(prefLabel)`,
 * and the moved subtree is re-levelled so the depth-gated rendering stays right.
 *
 * A `null` target drops the broader term instead of replacing it. The concept
 * surfaces at the root as an orphan — but only if that was its last broader
 * term in the scheme; one with several stays nested under the others, which is
 * what the query's `isOrphan` intersection will report.
 */
export function moveConcept(
  data: DocumentConcepts | null,
  move: ConceptMove,
): DocumentConcepts | null {
  if (!data) return data
  if (move.toParentId !== null && move.fromParentId === move.toParentId) return data

  const moved = findChildOf(data, move.conceptId, move.fromParentId)
  if (!moved) return data

  const next: DocumentConcepts = {
    ...data,
    topConcepts: applyMove(data.topConcepts ?? [], move, moved) as TopConceptTerm[],
    concepts: applyMove(data.concepts ?? [], move, moved),
  }

  return move.toParentId === null ? surfaceAtRoot(next, move.conceptId, moved) : next
}

/**
 * After a broader term is dropped, settle where the concept now belongs. It
 * only becomes an orphan if nothing else nests it; `trunkBuilder` already lists
 * every scheme member flat in `concepts[]`, so this usually flips `isOrphan` on
 * an entry that is present but filtered out of the root, rather than adding one.
 */
function surfaceAtRoot(
  data: DocumentConcepts,
  conceptId: string,
  moved: ChildConceptTerm,
): DocumentConcepts {
  if (isNestedAnywhere(data, conceptId)) return data

  const concepts = data.concepts ?? []
  if (concepts.some((concept) => concept.id === conceptId)) {
    return {
      ...data,
      concepts: concepts.map((concept) =>
        concept.id === conceptId ? {...relevelled(concept, 0), isOrphan: true} : concept,
      ),
    }
  }
  return {...data, concepts: insertInOrder(concepts, {...relevelled(moved, 0), isOrphan: true})}
}

/**
 * Whether fresh listener data already reflects a move, so the optimistic copy
 * of it can be dropped. The concept leaving its former parent is the signal —
 * it is what both a re-parent and a dropped broader term have in common, and it
 * arrives with the same refetch that would carry the new position.
 */
export function isMoveApplied(data: DocumentConcepts | null, move: ConceptMove): boolean {
  if (!data) return false
  return !isChildOf(data, move.conceptId, move.fromParentId)
}

/** Whether any node in the tree still lists this concept among its children. */
function isNestedAnywhere(data: DocumentConcepts, id: string): boolean {
  let nested = false
  eachNode(data, (node) => {
    if (node.childConcepts?.some((child) => child.id === id)) nested = true
  })
  return nested
}

function applyMove(
  nodes: ChildConceptTerm[],
  move: ConceptMove,
  moved: ChildConceptTerm,
): ChildConceptTerm[] {
  return nodes.map((node) => {
    let children = node.childConcepts

    if (node.id === move.fromParentId) {
      children = (children ?? []).filter((child) => child.id !== move.conceptId)
    }
    if (node.id === move.toParentId) {
      children = insertInOrder(children ?? [], relevelled(moved, (node.level ?? 0) + 1))
    }

    const next = children ? applyMove(children, move, moved) : children
    return next === node.childConcepts ? node : {...node, childConcepts: next}
  })
}

/** Insert a node among siblings ordered by `prefLabel`, as the query orders them. */
function insertInOrder(
  siblings: ChildConceptTerm[],
  node: ChildConceptTerm,
): ChildConceptTerm[] {
  const at = siblings.findIndex((sibling) => sibling.prefLabel.localeCompare(node.prefLabel) > 0)
  if (at === -1) return [...siblings, node]
  return [...siblings.slice(0, at), node, ...siblings.slice(at)]
}

/** A copy of the subtree with `level` renumbered from its new landing depth. */
function relevelled<T extends ChildConceptTerm>(node: T, level: number): T {
  if (!node.childConcepts) return {...node, level}
  return {
    ...node,
    level,
    childConcepts: node.childConcepts.map((child) => relevelled(child, level + 1)),
  }
}

function eachNode(data: DocumentConcepts, visit: (node: ChildConceptTerm) => void): void {
  const step = (nodes?: ChildConceptTerm[]): void => {
    if (!nodes) return
    for (const node of nodes) {
      visit(node)
      step(node.childConcepts)
    }
  }
  step(data.topConcepts as ChildConceptTerm[])
  step(data.concepts)
}

/** Every rendering of a concept — more than one when it has several broader terms. */
function occurrencesOf(data: DocumentConcepts, id: string): ChildConceptTerm[] {
  const found: ChildConceptTerm[] = []
  eachNode(data, (node) => {
    if (node.id === id) found.push(node)
  })
  return found
}

function findChildOf(
  data: DocumentConcepts,
  childId: string,
  parentId: string,
): ChildConceptTerm | undefined {
  let found: ChildConceptTerm | undefined
  eachNode(data, (node) => {
    if (found || node.id !== parentId) return
    found = node.childConcepts?.find((child) => child.id === childId)
  })
  return found
}

function isChildOf(data: DocumentConcepts, childId: string, parentId: string): boolean {
  return findChildOf(data, childId, parentId) !== undefined
}

function containsDescendant(node: ChildConceptTerm, id: string): boolean {
  return (node.childConcepts ?? []).some(
    (child) => child.id === id || containsDescendant(child, id),
  )
}

/** Generations below a node: zero for a leaf. */
function heightOf(node: ChildConceptTerm): number {
  if (!node.childConcepts?.length) return 0
  return 1 + Math.max(...node.childConcepts.map(heightOf))
}
