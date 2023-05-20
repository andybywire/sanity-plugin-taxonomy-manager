/**
 * Concept Removal Hook
 * Used for removing concepts and top concepts from the Concept Scheme
 * hierarchy view.
 * @todo: add in logic for removing top concepts vs concepts
 */

import {useClient} from 'sanity'
import {useToast} from '@sanity/ui'
import {useCallback} from 'react'

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

      client
        .patch(documentId)
        .unset([`${type}[_ref=="${conceptId}"]`])
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

//         .commit()
//         .then((res) => {
//           toast.push({
//             closable: true,
//             status: 'success',
//             title: 'Top concept created',
//             description: `Top concept created.`,
//           })
//           openInNewPane(res.documentIds[0])
//         })
//         .catch((err) => {
//           toast.push({
//             closable: true,
//             status: 'error',
//             title: 'Error creating top concept',
//             description: err.message,
//           })
//         })
//     },
//     [schemaBaseIri, toast, client, documentId, openInNewPane]
//   )
//   return createConcept
// }
