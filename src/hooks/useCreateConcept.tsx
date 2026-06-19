import {useToast} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {useCallback, useContext} from 'react'

import {TaxonomyConfigContext} from '../context'
import {createId} from '../core/createId'
import {planCreateConcept} from '../core/mutations'
import {useTaxonomyDataPort} from '../seams/TaxonomyPortContext'
import type {ConceptSchemeDocument} from '../types'

import {useOpenNewConceptPane} from './useOpenNewConceptPane'

/**
 * #### Concept Creation Hook
 * Used for creating concepts and top concepts from the Concept Scheme hierarchy
 * view. The release/version-aware transaction is planned purely in
 * `core/mutations` and executed through the data port; this hook stays thin —
 * it generates the random ids/keys, builds the plan, and handles the toast +
 * new-pane navigation.
 */
export function useCreateConcept(document: ConceptSchemeDocument) {
  const toast = useToast()
  const openInNewPane = useOpenNewConceptPane()
  const port = useTaxonomyDataPort()
  const applyConceptPlan = port.useApplyConceptPlan()

  // Ident config (identifier generation) comes from plugin options via context.
  const {ident} = useContext(TaxonomyConfigContext)
  const schemaBaseIri = document.displayed.baseIri

  const createConcept = useCallback(
    (conceptType: 'topConcept' | 'concept', concept?: {id: string; _originalId?: string}) => {
      const plan = planCreateConcept({
        scheme: document.displayed,
        conceptType,
        broaderConcept: concept?.id
          ? {id: concept.id, _originalId: concept._originalId ?? ''}
          : undefined,
        newConceptUuid: uuid(),
        conceptId: createId(ident),
        schemeBaseIri: schemaBaseIri,
        newConceptKey: uuid(),
        broaderKey: uuid(),
      })

      applyConceptPlan(plan)
        .then(() => {
          toast.push({closable: true, status: 'success', title: 'Created new concept'})
          openInNewPane(plan.newConceptId)
        })
        .catch((err) => {
          toast.push({
            closable: true,
            status: 'error',
            title: 'Error creating concept',
            description: err instanceof Error ? err.message : 'Unknown error occurred',
          })
        })
    },
    [document.displayed, ident, schemaBaseIri, applyConceptPlan, toast, openInNewPane]
  )
  return createConcept
}
