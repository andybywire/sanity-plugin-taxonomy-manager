import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {Card, Text} from '@sanity/ui'
import {useCallback, useState, type ReactNode} from 'react'

import {useConceptDrop, type ConceptDragPayload, type ConceptDropPayload} from '../../hooks'

/**
 * #### Concept Drag Context
 * Makes the hierarchy draggable. It owns nothing but the gesture: what a drop
 * means is `core/tree/canMoveConcept`, and carrying it out is `useConceptDrop`.
 *
 * Collisions are resolved with `pointerWithin`, so the row under the pointer
 * wins outright. Each row's target is its own header line rather than its outer
 * element, which would otherwise cover every row nested inside it.
 *
 * A drag starts only after the pointer travels a little way, so the buttons
 * along each row still take ordinary clicks.
 */
export function ConceptDragContext({children}: {children: ReactNode}) {
  const onDrop = useConceptDrop()
  const [dragging, setDragging] = useState<ConceptDragPayload | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 8}}))

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setDragging((event.active.data.current as ConceptDragPayload | undefined) ?? null)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setDragging(null)
      const active = event.active.data.current as ConceptDragPayload | undefined
      const over = (event.over?.data.current as ConceptDropPayload | undefined) ?? null
      if (active) onDrop(active, over)
    },
    [onDrop],
  )

  const handleDragCancel = useCallback(() => setDragging(null), [])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        {dragging && (
          <Card padding={2} radius={2} shadow={3} tone="primary">
            <Text size={1} textOverflow="ellipsis">
              {dragging.prefLabel || '[new concept]'}
            </Text>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  )
}
