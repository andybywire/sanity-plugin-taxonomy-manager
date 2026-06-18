import {useToast} from '@sanity/ui'
import {useCallback} from 'react'
import {useClient} from 'sanity'

import {planRemoveConcept} from '../core/mutations'
import type {ConceptSchemeDocument} from '../types'

/**
 * #### Concept Removal Hook
 * Used for removing concepts and top concepts from the Concept Scheme hierarchy
 * view. The release/version-aware transaction is planned purely in
 * core/mutations; this hook replays the plan and handles the toast.
 */
export function useRemoveConcept(document: ConceptSchemeDocument) {
  const toast = useToast()
  const client = useClient({apiVersion: '2025-02-19'})

  // conceptId is the id of the concept to be removed
  const removeConcept = useCallback(
    (conceptId: string, conceptType: string, prefLabel?: string) => {
      const plan = planRemoveConcept({
        scheme: document.displayed,
        conceptRef: conceptId,
        conceptType,
      })

      client
        .transaction()
        .createIfNotExists(plan.createIfNotExists)
        .patch(plan.schemeId, (patch) => patch.unset(plan.unsetPaths))
        .commit()
        .then((_res) => {
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
    [client, document.displayed, toast],
  )
  return removeConcept
}
