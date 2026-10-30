import {useToast} from '@sanity/ui/toast'
import {uuid} from '@sanity/uuid'
import {useCallback, useContext} from 'react'

import {OptimisticTreeContext} from '../context'
import {planMoveConcept} from '../core/mutations'
import type {ConceptMove} from '../core/tree/moveConcept'
import {useTaxonomyDataPort} from '../seams/TaxonomyPortContext'
import type {ConceptSchemeDocument} from '../types'

/** A concept as the tree renders it — enough to plan a move and name it in a toast. */
type MoveTerm = {id: string; _originalId?: string; prefLabel?: string}

/**
 * #### Concept Move Hook
 * Re-parents a concept in the hierarchy: drops the reference to the broader term
 * it currently hangs under, and adds one to the term it was moved to. A `null`
 * destination drops the broader term with nothing to replace it, leaving the
 * concept an orphan when that was its last one in the scheme.
 *
 * The move is planned purely in `core/mutations` and executed through the data
 * port; this hook stays thin — it generates the reference key, re-parents the
 * tree optimistically, reverts that if the mutation fails, and handles the
 * toast. Whether a move is *allowed* is decided by `core/tree/canMoveConcept`
 * at the point of interaction, before this is ever called.
 */
export function useMoveConcept(document: ConceptSchemeDocument) {
  const toast = useToast()
  const port = useTaxonomyDataPort()
  const applyConceptPlan = port.useApplyConceptPlan()
  const {markMoved, unmarkMoved} = useContext(OptimisticTreeContext)

  const moveConcept = useCallback(
    (concept: MoveTerm, fromParent: MoveTerm, toParent: MoveTerm | null) => {
      const base = {
        scheme: document.displayed,
        concept: {id: concept.id},
        fromParentId: fromParent.id,
      }
      const plan = toParent
        ? planMoveConcept({
            ...base,
            toParent: {id: toParent.id, _originalId: toParent._originalId},
            broaderKey: uuid(),
          })
        : planMoveConcept({...base, toParent: null})

      const move: ConceptMove = {
        conceptId: concept.id,
        fromParentId: fromParent.id,
        toParentId: toParent?.id ?? null,
      }

      // Re-parent the tree immediately; the live listener reconciles after.
      markMoved(move)

      const label = concept.prefLabel ? `"${concept.prefLabel}"` : 'Concept'

      applyConceptPlan(plan)
        .then(() => {
          toast.push({
            closable: true,
            status: 'success',
            title: toParent
              ? `${label} moved under "${toParent.prefLabel ?? 'its new broader term'}"`
              : `${label} is no longer under "${fromParent.prefLabel ?? 'its broader term'}"`,
          })
        })
        .catch((err) => {
          // Put the concept back where it was so the tree matches the dataset.
          unmarkMoved(move)
          toast.push({
            closable: true,
            status: 'error',
            title: 'Error moving concept',
            description: err instanceof Error ? err.message : 'Unknown error occurred',
          })
        })
    },
    [applyConceptPlan, document.displayed, toast, markMoved, unmarkMoved],
  )

  return moveConcept
}
