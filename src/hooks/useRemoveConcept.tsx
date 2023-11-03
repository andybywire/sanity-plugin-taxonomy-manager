/**
 * Concept Removal Hook
 * Used for removing concepts and top concepts from the Concept Scheme
 * hierarchy view.
 * TODO: type document, likely via extended SanityDocument type.
 */

import {useCallback} from 'react'
import {useClient} from 'sanity'
import {useToast} from '@sanity/ui'

// TODO: properly type document (as an extension of SanityDocument)
export function useRemoveConcept(document: any) {
  const toast = useToast()
  const client = useClient({apiVersion: '2021-10-21'})

  // The concept scheme from which the concept will be removed
  const documentId = document.displayed._id

  // conceptId is the id of the concept to be removed
  const removeConcept = useCallback(
    (conceptId: string, conceptType: string, prefLabel?: string) => {
      const type = conceptType == 'topConcept' ? 'topConcepts' : 'concepts'
      console.log('conceptId: ', conceptId)

      client
        .patch(documentId)
        .unset([`${type}[_ref=="${conceptId.replace('drafts.', '')}"]`])
        .commit()
        .then((res) => {
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
            description: err.message,
          })
        })
    },
    [client, documentId, toast]
  )
  return removeConcept
}
