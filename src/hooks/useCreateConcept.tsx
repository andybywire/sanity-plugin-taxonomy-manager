import {useToast} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {useCallback} from 'react'
import {useClient} from 'sanity'

import {getPluginConfig} from '../config'
import {createId} from '../core/createId'
import {planCreateConcept} from '../core/mutations'
import type {ConceptSchemeDocument} from '../types'

import {useOpenNewConceptPane} from './useOpenNewConceptPane'

/**
 * #### Concept Creation Hook
 * Used for creating concepts and top concepts from the
 * Concept Scheme hierarchy view. The release/version-aware transaction is
 * planned purely in core/mutations; this hook generates the random ids/keys,
 * replays the plan, and handles the toast + new-pane navigation.
 */
export function useCreateConcept(document: ConceptSchemeDocument) {
  const toast = useToast()
  const client = useClient({apiVersion: '2025-02-19'})
  const openInNewPane = useOpenNewConceptPane()

  // Ident config from the plugin, used to generate the concept's identifier.
  const ident = getPluginConfig()?.ident
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

      client
        .transaction()
        .createIfNotExists(plan.createIfNotExists)
        .create(plan.create)
        .patch(plan.schemeId, (patch) =>
          patch.setIfMissing({[plan.appendField]: []}).append(plan.appendField, [plan.reference]),
        )
        .commit({autoGenerateArrayKeys: true})
        .then((_res) => {
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
    [document.displayed, ident, schemaBaseIri, client, toast, openInNewPane],
  )
  return createConcept
}
