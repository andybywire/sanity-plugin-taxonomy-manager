import {useDraggable, useDroppable} from '@dnd-kit/core'
import {useCallback, useContext, useMemo} from 'react'

import {TreeContext} from '../context'
import {canMoveConcept} from '../core/tree/moveConcept'
import type {ChildConceptTerm} from '../types'

import type {ConceptDragPayload} from './useConceptDrop'

/**
 * #### Concept Row Drag Hook
 * Wires one hierarchy row as both a drag source and a drop target.
 *
 * The identifiers are the row's *edge* — concept plus the broader term it hangs
 * under — because a concept with several broader terms renders at several
 * points, and each of those is a distinct thing to pick up or drop onto.
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
  const edge = `${parentId ?? 'root'}:${concept.id}`
  const {concepts} = useContext(TreeContext)

  const {
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: `move:${edge}`,
    data: {conceptId: concept.id, fromParentId: parentId, prefLabel: concept.prefLabel},
    disabled: !draggable,
  })

  const {
    setNodeRef: setDropRef,
    isOver,
    active,
  } = useDroppable({
    id: `drop:${edge}`,
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
