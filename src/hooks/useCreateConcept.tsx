import {
  DocumentId,
  getDraftId,
  getVersionId,
  getVersionNameFromId,
  isVersionId,
  getPublishedId,
} from '@sanity/id-utils'
import {useToast} from '@sanity/ui'
import {randomKey} from '@sanity/util/content'
import {useCallback} from 'react'
import {useClient} from 'sanity'

import {useOpenNewConceptPane} from './useOpenNewConceptPane'

/**
 * #### WIP
 * Added support for Concept and Top Concept creation. These are
 * added to the scheme arrays as expected. They are not being added
 * to the tree view yet. Add child term is also working correctly,
 * but not being added to the tree view.
 * Remove terms is not working at all.
 */

/**
 * #### Concept Creation Hook
 * Used for creating concepts and top concepts from the Concept Scheme
 * hierarchy view.
 */
export function useCreateConcept(document: any) {
  const toast = useToast()
  const client = useClient({apiVersion: '2025-02-19'})
  const openInNewPane = useOpenNewConceptPane()

  const schemaBaseIri = document.displayed.baseIri // schema baseIri

  // conceptId represents the broader term, if it exists.
  const createConcept = useCallback(
    (conceptType: string, conceptId?: string, _prefLabel?: string) => {
      // prefLabel parameter is currently unused but kept for future use

      // Determine if we're in a release context
      const isInRelease = isVersionId(document.displayed._id)
      const releaseName = isInRelease ? getVersionNameFromId(document.displayed._id) : undefined

      // Generate appropriate IDs based on context
      const newConceptId = isInRelease
        ? getVersionId(DocumentId(randomKey()), releaseName as string)
        : getDraftId(DocumentId(randomKey()))

      let skosConcept: any
      if (conceptId) {
        // Handle broader concept reference
        const broaderId = isInRelease
          ? getVersionId(DocumentId(conceptId), releaseName as string)
          : getDraftId(DocumentId(conceptId))

        skosConcept = {
          _id: newConceptId,
          _type: 'skosConcept',
          conceptId: `${randomKey(6)}`,
          prefLabel: '',
          baseIri: schemaBaseIri,
          broader: [
            broaderId && {
              _key: randomKey(6),
              _ref: getPublishedId(broaderId),
              _type: 'reference',
              _strengthenOnPublish: {
                type: 'skosConcept',
                template: {id: 'skosConcept'},
              },
            },
          ],
          related: [],
        }
      } else {
        skosConcept = {
          _id: newConceptId,
          _type: 'skosConcept',
          conceptId: `${randomKey(6)}`,
          prefLabel: '',
          baseIri: schemaBaseIri,
          broader: [],
          related: [],
        }
      }

      // Handle concept scheme document
      const draftConceptScheme = JSON.parse(JSON.stringify(document.displayed))
      const schemeId = isInRelease
        ? getVersionId(draftConceptScheme._id, releaseName!)
        : getDraftId(draftConceptScheme._id)

      // if (!draftConceptScheme._id.includes('drafts.')) {
      //   draftConceptScheme._id = `drafts.${draftConceptScheme._id}`
      // }

      client
        .transaction()
        .createIfNotExists({...draftConceptScheme, _id: schemeId})
        .create(skosConcept)
        .patch(schemeId, (patch) => {
          if (conceptType == 'topConcept') {
            return patch.setIfMissing({topConcepts: []}).append('topConcepts', [
              {
                _ref: getPublishedId(newConceptId),
                _type: 'reference',
                _key: randomKey(6),
                _strengthenOnPublish: {
                  type: 'skosConcept',
                  template: {id: 'skosConcept'},
                },
              },
            ])
          }
          return patch.setIfMissing({concepts: []}).insert('after', 'concepts[-1]', [
            {
              _ref: getPublishedId(newConceptId),
              _type: 'reference',
              _key: randomKey(6),
              _strengthenOnPublish: {
                type: 'skosConcept',
                template: {id: 'skosConcept'},
              },
            },
          ])
        })
        .commit({autoGenerateArrayKeys: true})
        .then((_res) => {
          toast.push({
            closable: true,
            status: 'success',
            title: 'Created new concept',
          })
          openInNewPane(newConceptId)
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
