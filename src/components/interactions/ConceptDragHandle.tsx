import {DragHandleIcon} from '@sanity/icons/DragHandle'
import {Button} from '@sanity/ui'

import {SLOT_PADDING_X} from '../../hooks'

/**
 * #### Concept Drag Handle
 * The grip that picks a concept up, revealed when the pointer is over its row.
 *
 * Hidden with `visibility` rather than by not rendering, so the space it will
 * occupy is held open and the label beside it does not shift as the pointer
 * crosses the tree. A row being dragged keeps its handle visible even once the
 * pointer has left it behind.
 *
 * Rendered with no `handleProps` it is a spacer and nothing more: top concepts
 * cannot be dragged, but their rows reserve the same slot so that a root full
 * of top concepts and orphans shares one left edge.
 *
 * Deliberately not reachable by keyboard, and hidden from assistive technology:
 * dragging here is a pointer accelerator, and the accessible way to do the same
 * thing is `Move to…` in the row menu. Advertising a control that only a
 * pointer can work would be worse than leaving it unannounced. It is a `Button`
 * for its looks alone — to match the icons on the other side of the row.
 */
export function ConceptDragHandle({
  handleProps = {},
  visible,
}: {
  /** Omitted when the handle is only holding a slot open, never to be grabbed. */
  handleProps?: Record<string, unknown>
  visible: boolean
}) {
  return (
    <Button
      {...handleProps}
      aria-hidden="true"
      tabIndex={-1}
      icon={DragHandleIcon}
      mode="bleed"
      paddingX={SLOT_PADDING_X}
      // touchAction keeps a touch drag from scrolling the pane instead.
      style={{cursor: 'grab', touchAction: 'none', visibility: visible ? 'visible' : 'hidden'}}
    />
  )
}
