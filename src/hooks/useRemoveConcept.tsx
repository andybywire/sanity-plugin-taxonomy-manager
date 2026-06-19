import {useToast} from '@sanity/ui'
import {useCallback} from 'react'

import {planRemoveConcept} from '../core/mutations'
import {useTaxonomyDataPort} from '../seams/TaxonomyPortContext'
import type {ConceptSchemeDocument} from '../types'

/**
 * #### Concept Removal Hook
 * Used for removing concepts and top concepts from the Concept Scheme hierarchy
 * view. The release/version-aware transaction is planned purely in
 * `core/mutations` and executed through the data port; this hook replays the
 * plan and handles the toast.
 */
export function useRemoveConcept(document: ConceptSchemeDocument) {
  const toast = useToast()
  const port = useTaxonomyDataPort()
  const applyConceptPlan = port.useApplyConceptPlan()

  // conceptId is the id of the concept to be removed
  const removeConcept = useCallback(
    (conceptId: string, conceptType: string, prefLabel?: string) => {
      const plan = planRemoveConcept({
        scheme: document.displayed,
        conceptRef: conceptId,
        conceptType,
      })

      applyConceptPlan(plan)
        .then(() => {
          toast.push({
            closable: true,
            status: 'success',
            title: `${prefLabel ? `"${prefLabel}"` : 'Concept'} removed from scheme`,
          })
        })
        .catch((err) => {
          toast.push({
            closable: true,
            status: 'error',
            title: 'Error removing concept',
            description: err instanceof Error ? err.message : 'Unknown error occurred',
          })
        })
    },
    [applyConceptPlan, document.displayed, toast]
  )
  return removeConcept
}
