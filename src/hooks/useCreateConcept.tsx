/**
 * Concept Creation Hook
 * Used for creating concepts and top concepts from the Concept Scheme
 * hierarchy view.
 * @todo type document, likely via extended SanityDocument type.
 */

import {useClient} from 'sanity'
import {useToast} from '@sanity/ui'
import {useCallback} from 'react'
import {randomKey} from '@sanity/util/content'
import {useOpenNewConceptPane} from './useOpenNewConceptPane'

export function useCreateConcept(document: any) {
  const toast = useToast()
  const client = useClient({apiVersion: '2021-10-21'})
  const openInNewPane = useOpenNewConceptPane()

  const schemaBaseIri = document.displayed.baseIri // schema baseIri

  // conceptId here is the broader term. Re-label this for clarity.
  const createConcept = useCallback(
    (conceptType: string, conceptId?: string, prefLabel?: string) => {
      let skosConcept: any
      if (conceptId) {
        skosConcept = {
          _id: `drafts.${randomKey()}`,
          _type: 'skosConcept',
          conceptId: `${randomKey(6)}`,
          prefLabel: '',
          baseIri: schemaBaseIri,
          broader: [
            conceptId && {
              _key: randomKey(6),
              _ref: conceptId,
              _type: 'reference',
            },
          ],
          related: [],
        }
      } else {
        skosConcept = {
          _id: `drafts.${randomKey()}`,
          _type: 'skosConcept',
          conceptId: `${randomKey(6)}`,
          prefLabel: '',
          baseIri: schemaBaseIri,
          broader: [],
          related: [],
        }
      }

      // Ensure concepts are added to a draft of the concept scheme document
      const draftConceptScheme = JSON.parse(JSON.stringify(document.displayed))
      if (!draftConceptScheme._id.includes('drafts.')) {
        draftConceptScheme._id = `drafts.${draftConceptScheme._id}`
      }

      // work out the "reference in place" logic
      // https://www.sanity.io/blog/obvious-features-aren-t-obviously-made#2c38c9f38060
      // https://github.com/search?q=repo%3Asanity-io%2Fsanity%20_strengthenOnPublish&type=code

      // if (documentId.includes('drafts.')) {
      client
        .transaction()
        // use createIfNotExist here to make sure there's a draft conceptScheme
        // this may need to be the start of a .then() chain
        .createIfNotExists(draftConceptScheme)
        .create(skosConcept)
        .patch(draftConceptScheme._id, (patch) => {
          if (conceptType == 'topConcept') {
            return patch.setIfMissing({topConcepts: []}).append('topConcepts', [
              {
                _ref: skosConcept._id.replace('drafts.', ''),
                _type: 'reference',
                _strengthenOnPublish: {
                  _type: 'skosConcept',
                  weak: true,
                  template: {id: 'skosConcept'},
                },
              },
            ])
          }
          return patch.setIfMissing({concepts: []}).insert('after', 'concepts[-1]', [
            {
              _ref: skosConcept._id.replace('drafts.', ''),
              _type: 'reference',
              _key: randomKey(6),
              _weak: true,
              _strengthenOnPublish: {
                _type: 'skosConcept',
                weak: undefined,
                template: {id: 'skosConcept', params: 'undefined'},
              },
            },
          ])
        })
        .commit({autoGenerateArrayKeys: true})
        .then((res) => {
          toast.push({
            closable: true,
            status: 'success',
            title: 'Created new concept',
          })
          openInNewPane(skosConcept._id)
        })
        .catch((err) => {
          toast.push({
            closable: true,
            status: 'error',
            title: 'Error creating concept',
            description: err.message,
          })
        })
      // return
      // }
      // client
      //   .fetch(`*[_id == "${documentId}"][0]`)
      //   .then((draftDoc) => {
      //     draftDoc._id = `drafts.${draftDoc._id}`
      //     client.create(draftDoc)
      //     return draftDoc
      //   })
      //   .then((draftDoc) => {
      //     client
      //       .transaction()
      //       .create(skosConcept)
      //       .patch(draftDoc._id, (patch) => {
      //         if (conceptType == 'topConcept') {
      //           return patch.setIfMissing({topConcepts: []}).append('topConcepts', [
      //             {
      //               _ref: skosConcept._id.replace('drafts.', ''),
      //               _type: 'reference',
      //               _strengthenOnPublish: {
      //                 _type: 'skosConcept',
      //                 weak: true,
      //                 template: {id: 'skosConcept'},
      //               },
      //             },
      //           ])
      //         }
      //         return patch.setIfMissing({concepts: []}).insert('after', 'concepts[-1]', [
      //           {
      //             _ref: skosConcept._id.replace('drafts.', ''),
      //             _type: 'reference',
      //             _strengthenOnPublish: {
      //               _type: 'skosConcept',
      //               weak: true,
      //               template: {id: 'skosConcept'},
      //             },
      //           },
      //         ])
      //       })
      //       .commit({autoGenerateArrayKeys: true})
      //       .then((res) => {
      //         toast.push({
      //           closable: true,
      //           status: 'success',
      //           title: 'Created new concept',
      //         })
      //         openInNewPane(skosConcept._id)
      //       })
      //       .catch((err) => {
      //         toast.push({
      //           closable: true,
      //           status: 'error',
      //           title: 'Error creating concept',
      //           description: err.message,
      //         })
      //       })
      //   })
    },
    [schemaBaseIri, toast, client, openInNewPane]
  )
  return createConcept
}
