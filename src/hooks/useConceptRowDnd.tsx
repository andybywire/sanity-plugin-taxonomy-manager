import {useDraggable, useDroppable} from '@dnd-kit/core'
import {useCallback, useContext, useMemo} from 'react'

import {TreeContext} from '../context'
import {canMoveConcept} from '../core/tree/moveConcept'
import type {ChildConceptTerm} from '../types'

import type {ConceptDragPayload} from './useConceptDrop'

/**
 * The dnd-kit identifiers for one row.
 *
 * The identifiers are the row's *edge* — concept plus the broader term it hangs
 * under — because a concept with several broader terms renders at several
 * points, and each of those is a distinct thing to pick up or drop onto.
 *
 * They are additionally scoped by role, and that part is load-bearing. dnd-kit
 * keys its registries by id alone: registering overwrites any entry under the
 * same id, while unregistering deletes it whenever the keys match. The effect
 * that does both is keyed on the id, so a hook whose entry was overwritten
 * never registers itself again.
 *
 * `Move to…` renders a second tree of the same concepts, inside the same
 * `DndContext` as the tree behind it. With unscoped ids that sequence is
 * destructive: opening the dialog evicts every row of the structure tree from
 * the droppable registry, and closing it deletes them. Dragging still starts,
 * but no row is a drop target any more — nothing highlights, nothing can be
 * dropped, and only a reload puts it right.
 *
 * Only the structure tree takes drops, so `droppable` is what tells the two
 * apart.
 */
export function conceptRowDndIds({
  conceptId,
  parentId,
  droppable,
}: {
  conceptId: string
  parentId: string | null
  droppable: boolean
}): {draggableId: string; droppableId: string} {
  const edge = `${droppable ? 'tree' : 'picker'}:${parentId ?? 'root'}:${conceptId}`
  return {draggableId: `move:${edge}`, droppableId: `drop:${edge}`}
}

/**
 * #### Concept Row Drag Hook
 * Wires one hierarchy row as both a drag source and a drop target.
 *
 * Whether a hovered row will take the drop is worked out only while it is
 * hovered, so one check runs per hover rather than one per row per frame.
 */
export function useConceptRowDnd({
  concept,
  parentId,
  draggable,
  droppable,
}: {
  concept: ChildConceptTerm
  /** The broader term this row hangs under; `null` at the root. */
  parentId: string | null
  /** Top concepts are drop targets but cannot themselves be dragged. */
  draggable: boolean
  /** False inside the field inputs, which have no drag context to belong to. */
  droppable: boolean
}) {
  const {draggableId, droppableId} = conceptRowDndIds({
    conceptId: concept.id,
    parentId,
    droppable,
  })
  const {concepts} = useContext(TreeContext)

  const {
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: draggableId,
    data: {conceptId: concept.id, fromParentId: parentId, prefLabel: concept.prefLabel},
    disabled: !draggable,
  })

  const {
    setNodeRef: setDropRef,
    isOver,
    active,
  } = useDroppable({
    id: droppableId,
    disabled: !droppable,
    data: {
      conceptId: concept.id,
      _originalId: concept._originalId,
      prefLabel: concept.prefLabel,
    },
  })

  const accepts = useMemo(() => {
    if (!isOver || !active) return null
    const payload = active.data.current as ConceptDragPayload | undefined
    if (!payload) return null
    return canMoveConcept({
      data: concepts ?? null,
      conceptId: payload.conceptId,
      fromParentId: payload.fromParentId,
      toParentId: concept.id,
    }).allowed
  }, [isOver, active, concepts, concept.id])

  // One element is both the thing picked up and the thing dropped onto.
  const setRowRef = useCallback(
    (node: HTMLElement | null) => {
      setDragRef(node)
      setDropRef(node)
    },
    [setDragRef, setDropRef],
  )

  return {setRowRef, handleProps: listeners ?? {}, isDragging, isOver, accepts}
}
