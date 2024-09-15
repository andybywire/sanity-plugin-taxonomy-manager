import {useCallback} from 'react'
import {useClient} from 'sanity'
import {useToast} from '@sanity/ui'

/**
 * #### Concept Removal Hook
 * Used for removing concepts and top concepts from the Concept Scheme
 * hierarchy view.
 */
export function useRemoveConcept(document: any) {
  const toast = useToast()
  const client = useClient({apiVersion: '2021-10-21'})

  // conceptId is the id of the concept to be removed
  const removeConcept = useCallback(
    (conceptId: string, conceptType: string, prefLabel?: string) => {
      const type = conceptType == 'topConcept' ? 'topConcepts' : 'concepts'

      // Ensure concepts are removed from a draft of the concept scheme document
      const draftConceptScheme = JSON.parse(JSON.stringify(document.displayed))

      if (!draftConceptScheme._id.includes('drafts.')) {
        draftConceptScheme._id = `drafts.${draftConceptScheme._id}`
      }

      client
        .transaction()
        .createIfNotExists(draftConceptScheme)
        .patch(draftConceptScheme._id, (patch) =>
          patch.unset([`${type}[_ref=="${conceptId.replace('drafts.', '')}"]`])
        )
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
    [client, document.displayed, toast]
  )
  return removeConcept
}
