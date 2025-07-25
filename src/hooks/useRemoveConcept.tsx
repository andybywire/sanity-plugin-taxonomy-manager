import {
  DocumentId,
  getDraftId,
  getVersionId,
  getVersionNameFromId,
  isVersionId,
  type VersionId,
} from '@sanity/id-utils'
import {useToast} from '@sanity/ui'
import {useCallback} from 'react'
import {useClient} from 'sanity'

import type {ConceptSchemeDocument} from '../types'

/**
 * #### Concept Removal Hook
 * Used for removing concepts and top concepts from
 * the Concept Scheme hierarchy view.
 */
export function useRemoveConcept(document: ConceptSchemeDocument) {
  const toast = useToast()
  const client = useClient({apiVersion: '2025-02-19'})

  // conceptId is the id of the concept to be removed
  const removeConcept = useCallback(
    (conceptId: string, conceptType: string, prefLabel?: string) => {
      const type = conceptType == 'topConcept' ? 'topConcepts' : 'concepts'

      const isInRelease = isVersionId(document.displayed._id as DocumentId)
      const releaseName = isInRelease
        ? getVersionNameFromId(document.displayed._id as VersionId)
        : undefined

      const schemeId = isInRelease
        ? getVersionId(DocumentId(document.displayed._id), releaseName as string)
        : getDraftId(DocumentId(document.displayed._id))

      // Ensure concepts are removed from a draft of the concept scheme document
      // const draftConceptScheme = JSON.parse(JSON.stringify(document.displayed))

      // if (!draftConceptScheme._id.includes('drafts.')) {
      //   draftConceptScheme._id = `drafts.${draftConceptScheme._id}`
      // }

      client
        .transaction()
        .createIfNotExists({...document.displayed, _id: schemeId})
        .patch(schemeId, (patch) => patch.unset([`${type}[_ref=="${conceptId}"]`]))
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
    [client, document.displayed, toast]
  )
  return removeConcept
}
