import {
  DocumentId,
  getDraftId,
  getVersionId,
  getVersionNameFromId,
  isVersionId,
  getPublishedId,
  type VersionId,
} from '@sanity/id-utils'
import {useToast} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {nanoid} from 'nanoid'
import {useCallback} from 'react'
import {useClient} from 'sanity'

import type {ConceptSchemeDocument} from '../components/TreeView'
import type {SkosConceptDocument, SkosConceptReference} from '../types'

import {useOpenNewConceptPane} from './useOpenNewConceptPane'

/**
 * #### Concept Creation Hook
 * Used for creating concepts and top concepts from the Concept Scheme
 * hierarchy view.
 */
export function useCreateConcept(document: ConceptSchemeDocument) {
  const toast = useToast()
  const client = useClient({apiVersion: '2025-02-19'})
  const openInNewPane = useOpenNewConceptPane()

  const schemaBaseIri = document.displayed.baseIri

  const createConcept = useCallback(
    (conceptType: string, conceptId?: string, _prefLabel?: string) => {
      // prefLabel parameter is currently unused but kept for future use

      const isInRelease = isVersionId(document.displayed._id as DocumentId)
      const releaseName = isInRelease
        ? getVersionNameFromId(document.displayed._id as VersionId)
        : undefined

      // Generate appropriate IDs based on context
      const newConceptId = isInRelease
        ? getVersionId(DocumentId(uuid()), releaseName as string)
        : getDraftId(DocumentId(uuid()))

      const schemeId = isInRelease
        ? getVersionId(DocumentId(document.displayed._id), releaseName as string)
        : getDraftId(DocumentId(document.displayed._id))

      const skosConcept: SkosConceptDocument = {
        _id: newConceptId,
        _type: 'skosConcept',
        conceptId: `${nanoid(6)}`,
        prefLabel: '',
        baseIri: schemaBaseIri,
        broader: [],
        related: [],
      }

      if (conceptId) {
        // Handle broader concept reference
        // conceptId represents the broader term, if it exists.
        // TODO: rename this for clarity when I work on tree view
        const broaderId = isInRelease
          ? getVersionId(DocumentId(conceptId), releaseName as string)
          : getDraftId(DocumentId(conceptId))

        skosConcept.broader = [
          broaderId && {
            _key: uuid(),
            _ref: getPublishedId(broaderId),
            _type: 'reference',
            _strengthenOnPublish: {
              type: 'skosConcept',
              template: {id: 'skosConcept'},
            },
          },
        ]
      }

      const skosConceptReference: SkosConceptReference = {
        _ref: getPublishedId(newConceptId),
        _type: 'reference',
        _key: uuid(),
        _strengthenOnPublish: {
          type: 'skosConcept',
          template: {id: 'skosConcept'},
        },
        _weak: true,
      }

      client
        .transaction()
        .createIfNotExists({...document.displayed, _id: schemeId})
        .create(skosConcept)
        .patch(schemeId, (patch) => {
          if (conceptType == 'topConcept') {
            return patch
              .setIfMissing({topConcepts: []})
              .append('topConcepts', [skosConceptReference])
          }
          return patch.setIfMissing({concepts: []}).append('concepts', [skosConceptReference])
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
            description: err instanceof Error ? err.message : 'Unknown error occurred',
          })
        })
    },
    [document.displayed, client, schemaBaseIri, toast, openInNewPane]
  )
  return createConcept
}
