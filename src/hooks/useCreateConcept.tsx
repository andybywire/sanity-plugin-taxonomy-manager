/**
 * Concept Creation Hook
 * Used for creating concepts and top concepts from the Concept Scheme
 * hierarchy view.
 */

import {useClient} from 'sanity'
import {useToast} from '@sanity/ui'
import {useCallback} from 'react'
import {randomKey} from '@sanity/util/content'
import {useOpenNewConceptPane} from './useOpenNewConceptPane'

// TODO: properly type document (as an extension of SanityDocument)
export function useCreateConcept(document: any) {
  const toast = useToast()
  const client = useClient({apiVersion: '2021-10-21'})
  const openInNewPane = useOpenNewConceptPane()

  const documentId = document.displayed._id
  const schemaBaseIri = document.displayed.baseIri

  const createConcept = useCallback(
    (conceptType: string, conceptId?: string, prefLabel?: string) => {
      const skosConcept = {
        _id: `sc-${randomKey(6)}`,
        _type: 'skosConcept',
        prefLabel: '',
        baseIri: schemaBaseIri,
        broader: [
          (conceptId && {
            _key: randomKey(6),
            _ref: conceptId,
            _type: 'reference',
          }) ||
            null,
        ],
        related: [],
      }

      toast.push({
        closable: true,
        status: 'info',
        title: 'Creating concept',
        // description: 'This message is just a test.',
      })

      client
        .transaction()
        .create(skosConcept)
        // consider using .append: https://www.sanity.io/docs/js-client#appending-prepending-elements-to-an-array
        .patch(documentId, (patch) => {
          if (conceptType == 'topConcept') {
            return patch
              .setIfMissing({topConcepts: []})
              .insert('after', 'topConcepts[-1]', [{_ref: skosConcept._id, _type: 'reference'}])
          }
          return patch
            .setIfMissing({concepts: []})
            .insert('after', 'concepts[-1]', [{_ref: skosConcept._id, _type: 'reference'}])
        })
        .commit({autoGenerateArrayKeys: true})
        .then((res) => {
          toast.push({
            closable: true,
            status: 'success',
            title: 'Concept created',
            // description: `Concept created.`,
          })
          openInNewPane(res.documentIds[0])
        })
        .catch((err) => {
          toast.push({
            closable: true,
            status: 'error',
            title: 'Error creating concept',
            description: err.message,
          })
        })
    },
    [schemaBaseIri, toast, client, documentId, openInNewPane]
  )
  return createConcept
}
