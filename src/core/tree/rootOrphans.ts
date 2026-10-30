import type {ChildConceptTerm, DocumentConcepts} from '../../types'

/**
 * The concepts the tree shows at its root alongside the top concepts.
 *
 * `trunkBuilder` projects *every* member of the scheme into `concepts`, flagging
 * the ones with no broader term inside the scheme. Only those belong at the
 * root; the rest are already rendered under their broader terms.
 */
export function rootOrphans(data: DocumentConcepts | null): ChildConceptTerm[] {
  return (data?.concepts ?? []).filter((concept) => concept?.isOrphan)
}

/**
 * Whether the root holds anything draggable besides top concepts.
 *
 * Top concepts cannot be dragged, so their rows reserve a slot for the grip only
 * when a sibling at the root has one — otherwise every row at the root is
 * immovable and the reserved column is dead space. A scheme that gains its first
 * orphan therefore shifts its root rows, which is a fair signal that the row now
 * affords something it did not before.
 */
export function hasRootOrphans(data: DocumentConcepts | null): boolean {
  return rootOrphans(data).length > 0
}
