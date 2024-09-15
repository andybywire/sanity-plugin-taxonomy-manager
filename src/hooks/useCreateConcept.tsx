import {useClient} from 'sanity'
import {useToast} from '@sanity/ui'
import {useCallback} from 'react'
import {randomKey} from '@sanity/util/content'
import {useOpenNewConceptPane} from './useOpenNewConceptPane'

/**
 * #### Concept Creation Hook
 * Used for creating concepts and top concepts from the Concept Scheme
 * hierarchy view.
 */
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

      client
        .transaction()
        // use createIfNotExist here to make sure there's a draft conceptScheme
        .createIfNotExists(draftConceptScheme)
        .create(skosConcept)
        // patch concept or top concept as a reference in place:
        // https://www.sanity.io/blog/obvious-features-aren-t-obviously-made#2c38c9f38060
        // https://github.com/search?q=repo%3Asanity-io%2Fsanity%20_strengthenOnPublish&type=code
        .patch(draftConceptScheme._id, (patch) => {
          if (conceptType == 'topConcept') {
            return patch.setIfMissing({topConcepts: []}).append('topConcepts', [
              {
                _ref: skosConcept._id.replace('drafts.', ''),
                _type: 'reference',
                _key: randomKey(6),
                _weak: true,
                _strengthenOnPublish: {
                  _type: 'skosConcept',
                  weak: true,
                  template: {id: 'skosConcept', params: 'undefined'},
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
    },
    [document.displayed, client, schemaBaseIri, toast, openInNewPane]
  )
  return createConcept
}
