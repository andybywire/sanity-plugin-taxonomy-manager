import type {ChildConceptTerm, DocumentConcepts} from '../../types'

/** A concept being filed as a child of another, named by the pair. */
export type ConceptInsert = {
  conceptId: string
  prefLabel: string
  /** The concept it is being filed under. */
  parentId: string
}

/**
 * #### Insert Concept In Tree
 * Put an existing concept under its new broader term in the rendered tree,
 * ahead of the live listener catching up.
 *
 * Only the new occurrence is added. The concept is being inserted precisely
 * because it was not a member of this scheme, so it is nowhere else in the tree
 * and nothing has to be removed. Its own children are not known here — the
 * picker returns a label and an id — and arrive with the refetch.
 *
 * Same contract as the other tree transforms: the input is never mutated, and
 * the same reference comes back when there is nothing to do, so an insert that
 * has already landed costs no re-render.
 */
export function insertConceptInTree(
  data: DocumentConcepts | null,
  insert: ConceptInsert,
): DocumentConcepts | null {
  if (!data) return null
  if (!hasParent(data, insert.parentId)) return data
  if (isInsertApplied(data, insert)) return data

  return {
    topConcepts: data.topConcepts.map((node) => withInsert(node, insert)),
    concepts: data.concepts.map((node) => withInsert(node, insert)),
  }
}

/** Rebuild a node, adding the concept wherever the parent is found beneath it. */
function withInsert<T extends ChildConceptTerm>(node: T, insert: ConceptInsert): T {
  if (node.id === insert.parentId) {
    const level = (node.level ?? 0) + 1
    return {
      ...node,
      childConcepts: insertInOrder(node.childConcepts ?? [], {
        id: insert.conceptId,
        prefLabel: insert.prefLabel,
        level,
      }),
    }
  }

  if (!node.childConcepts?.length) return node
  return {...node, childConcepts: node.childConcepts.map((child) => withInsert(child, insert))}
}

/** Alphabetical by `prefLabel`, matching the `|order(prefLabel)` in the query. */
function insertInOrder(siblings: ChildConceptTerm[], node: ChildConceptTerm): ChildConceptTerm[] {
  const at = siblings.findIndex((sibling) => sibling.prefLabel.localeCompare(node.prefLabel) > 0)
  if (at === -1) return [...siblings, node]
  return [...siblings.slice(0, at), node, ...siblings.slice(at)]
}

function hasParent(data: DocumentConcepts, parentId: string): boolean {
  let found = false
  eachNode(data, (node) => {
    if (node.id === parentId) found = true
  })
  return found
}

/**
 * Whether fresh data already reflects the insert, so the optimistic replay can
 * stop — otherwise the concept would be added a second time on top of the
 * listener's own result. Mirrors `isMoveApplied` and `isTopConceptApplied`.
 */
export function isInsertApplied(data: DocumentConcepts | null, insert: ConceptInsert): boolean {
  if (!data) return false
  let applied = false
  eachNode(data, (node) => {
    if (
      node.id === insert.parentId &&
      node.childConcepts?.some((child) => child.id === insert.conceptId)
    ) {
      applied = true
    }
  })
  return applied
}

/** Every node in the tree, roots and descendants alike. */
function eachNode(data: DocumentConcepts, visit: (node: ChildConceptTerm) => void): void {
  const walk = (nodes: ChildConceptTerm[] | undefined): void => {
    if (!nodes) return
    for (const node of nodes) {
      visit(node)
      walk(node.childConcepts)
    }
  }
  walk(data.topConcepts)
  walk(data.concepts)
}

/** A concept being added at the root of a scheme, as a top concept or a plain one. */
export type RootConceptInsert = {
  conceptId: string
  prefLabel: string
  asTopConcept: boolean
}

/**
 * #### Insert Root Concept In Tree
 * Put an existing concept at the root of the rendered tree, ahead of the live
 * listener.
 *
 * The companion to {@link insertConceptInTree} for the case with no broader
 * term: a top concept joins `topConcepts`, a plain one joins `concepts` marked
 * `isOrphan`, which is what puts it at the root beside them.
 *
 * A plain concept that already has a broader term inside this scheme does not
 * belong here — it renders under that term, and the caller resolves it with
 * `inSchemeBroaderRef` and uses `insertConceptInTree` instead.
 */
export function insertRootConceptInTree(
  data: DocumentConcepts | null,
  insert: RootConceptInsert,
): DocumentConcepts | null {
  if (!data) return null
  if (isRootInsertApplied(data, insert)) return data

  const node = {id: insert.conceptId, prefLabel: insert.prefLabel, level: 0}

  return insert.asTopConcept
    ? {...data, topConcepts: insertInOrder(data.topConcepts, node)}
    : {...data, concepts: insertInOrder(data.concepts, {...node, isOrphan: true})}
}

/**
 * Whether fresh data already reflects the root insert, so the optimistic replay
 * can stop. Mirrors {@link isInsertApplied}.
 */
export function isRootInsertApplied(
  data: DocumentConcepts | null,
  insert: RootConceptInsert,
): boolean {
  if (!data) return false
  const list = insert.asTopConcept ? data.topConcepts : data.concepts
  return list.some((node) => node.id === insert.conceptId)
}
