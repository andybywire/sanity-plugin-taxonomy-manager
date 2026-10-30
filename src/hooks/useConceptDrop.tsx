import {useToast} from '@sanity/ui/toast'
import {useCallback, useContext} from 'react'

import {SchemeContext, TreeContext} from '../context'
import {canMoveConcept, findConcept} from '../core/tree/moveConcept'
import type {ConceptSchemeDocument} from '../types'

import {useMoveConcept} from './useMoveConcept'

/** What a dragged row carries: the concept, and the broader term it is leaving. */
export type ConceptDragPayload = {
  conceptId: string
  fromParentId: string | null
  prefLabel?: string
}

/** What a row offers as a destination. */
export type ConceptDropPayload = {
  conceptId: string
  _originalId?: string
  prefLabel?: string
}

/**
 * #### Concept Drop Hook
 * Resolves a drop: decides whether the hierarchy will take it, and either moves
 * the concept or says why not.
 *
 * It takes plain payloads rather than drag-library events, so the decision and
 * the dispatch can be exercised without a layout engine — jsdom has none, and
 * collision detection cannot resolve a target without one. The drag context
 * does nothing but translate its own event shape into these two arguments.
 */
export function useConceptDrop() {
  const toast = useToast()
  const scheme: ConceptSchemeDocument = useContext(SchemeContext) || ({} as ConceptSchemeDocument)
  const {concepts} = useContext(TreeContext)
  const moveConcept = useMoveConcept(scheme)

  return useCallback(
    (active: ConceptDragPayload, over: ConceptDropPayload | null) => {
      // Dropped outside any row: nothing was asked for, so nothing is said.
      if (!over) return

      const tree = concepts ?? null
      const check = canMoveConcept({
        data: tree,
        conceptId: active.conceptId,
        fromParentId: active.fromParentId,
        toParentId: over.conceptId,
      })

      if (!check.allowed) {
        toast.push({closable: true, status: 'warning', title: check.reason})
        return
      }

      const fromParent =
        active.fromParentId === null
          ? null
          : {
              id: active.fromParentId,
              prefLabel: findConcept(tree, active.fromParentId)?.prefLabel,
            }

      moveConcept({id: active.conceptId, prefLabel: active.prefLabel}, fromParent, {
        id: over.conceptId,
        _originalId: over._originalId,
        prefLabel: over.prefLabel,
      })
    },
    [concepts, moveConcept, toast],
  )
}
