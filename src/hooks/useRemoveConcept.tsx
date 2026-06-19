import {useToast} from '@sanity/ui'
import {useCallback, useContext} from 'react'

import {OptimisticTreeContext} from '../context'
import {planRemoveConcept} from '../core/mutations'
import {useTaxonomyDataPort} from '../seams/TaxonomyPortContext'
import type {ConceptSchemeDocument} from '../types'

/**
 * #### Concept Removal Hook
 * Used for removing concepts and top concepts from the Concept Scheme hierarchy
 * view. The release/version-aware transaction is planned purely in
 * `core/mutations` and executed through the data port; this hook replays the
 * plan, prunes the concept from the tree optimistically (reverting if the
 * mutation fails), and handles the toast.
 */
export function useRemoveConcept(document: ConceptSchemeDocument) {
  const toast = useToast()
  const port = useTaxonomyDataPort()
  const applyConceptPlan = port.useApplyConceptPlan()
  const {markRemoved, unmarkRemoved} = useContext(OptimisticTreeContext)

  // conceptId is the id of the concept to be removed
  const removeConcept = useCallback(
    (conceptId: string, conceptType: string, prefLabel?: string) => {
      const plan = planRemoveConcept({
        scheme: document.displayed,
        conceptRef: conceptId,
        conceptType,
      })

      // Prune from the tree immediately; the live listener reconciles after.
      markRemoved(conceptId)

      applyConceptPlan(plan)
        .then(() => {
          toast.push({
            closable: true,
            status: 'success',
            title: `${prefLabel ? `"${prefLabel}"` : 'Concept'} removed from scheme`,
          })
        })
        .catch((err) => {
          // Roll the optimistic removal back so the concept reappears.
          unmarkRemoved(conceptId)
          toast.push({
            closable: true,
            status: 'error',
            title: 'Error removing concept',
            description: err instanceof Error ? err.message : 'Unknown error occurred',
          })
        })
    },
    [applyConceptPlan, document.displayed, toast, markRemoved, unmarkRemoved]
  )
  return removeConcept
}
