/**
 * #### Row Scaffolding
 * Which of a hierarchy row's leading slots exist.
 *
 * Shared by the Tree View's row and the governance view's, which is the point:
 * the two render the same hierarchy in sibling tabs, so a slot one of them
 * holds open and the other does not shows up as every label jumping sideways
 * when an editor switches between them. The rule is one function rather than
 * two readings of the same conditions.
 *
 * Pure: reads its arguments and returns a boolean.
 */

/**
 * #### Reserves Grip Slot
 * Whether a row holds open the width of the drag handle.
 *
 * True wherever the Tree View would draw a grip, which is not the same as
 * "this row can be dragged". A top concept cannot be: its move would have to
 * cross between the scheme's `topConcepts` and `concepts` arrays, which is
 * promotion rather than a re-parent. It still holds the slot when the scheme
 * has root orphans, because those *can* be dragged and sit as its siblings —
 * without it they would read as nested one level in.
 *
 * The governance view reserves by the same rule while dragging nothing, so its
 * rows line up with the Tree View's at every level.
 */
export function reservesGripSlot({
  isTopConcept,
  canEdit,
  schemeHasRootOrphans,
}: {
  isTopConcept: boolean
  /** Whether editing is offered at all — false in the published perspective. */
  canEdit: boolean
  /** Whether the scheme has orphans at its root, which are draggable. */
  schemeHasRootOrphans: boolean
}): boolean {
  if (!canEdit) return false
  return !isTopConcept || schemeHasRootOrphans
}
