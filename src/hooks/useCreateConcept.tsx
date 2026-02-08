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
import {useCallback} from 'react'
import {isPublishedId, useClient} from 'sanity'

import {getPluginConfig} from '../config'
import {createId} from '../helpers/createId'
import type {SkosConceptDocument, SkosConceptReference, ConceptSchemeDocument} from '../types'

import {useOpenNewConceptPane} from './useOpenNewConceptPane'

/**
 * #### Concept Creation Hook
 * Used for creating concepts and top concepts from the
 * Concept Scheme hierarchy view.
 */
export function useCreateConcept(document: ConceptSchemeDocument) {
  const toast = useToast()
  const client = useClient({apiVersion: '2025-02-19'})
  const openInNewPane = useOpenNewConceptPane()

  // Get ident config from plugin
  const pluginConfig = getPluginConfig()
  const ident = pluginConfig?.ident

  const schemaBaseIri = document.displayed.baseIri

  const createConcept = useCallback(
    (
      conceptType: 'topConcept' | 'concept',
      concept?: {
        id: string
        _originalId?: string
      }
    ) => {
      // destructure IDs and rename for this context
      const {id: broaderConceptId, _originalId: broaderConceptOriginalId = ''} = concept || {}
      // check if the skosConceptScheme is in a release
      const isInRelease = isVersionId(document.displayed._id as DocumentId)
      // if so, get the release name
      const releaseName = isInRelease
        ? getVersionNameFromId(document.displayed._id as VersionId)
        : undefined

      // create a scheme ID based on context
      const schemeId = isInRelease
        ? getVersionId(DocumentId(document.displayed._id), releaseName as string)
        : getDraftId(DocumentId(document.displayed._id))

      // Generate the appropriate concept ID based on context
      const newConceptId = isInRelease
        ? getVersionId(DocumentId(uuid()), releaseName as string)
        : getDraftId(DocumentId(uuid()))

      // create the new skosConcept document
      const skosConcept: SkosConceptDocument = {
        _id: newConceptId, // either a draft ID or a release ID
        _type: 'skosConcept',
        conceptId: createId(ident),
        prefLabel: '',
        baseIri: schemaBaseIri,
        broader: [],
        related: [],
      }

      // if a broader concept ID is provided, add it to the skosConcept
      if (broaderConceptId) {
        // check if the broader concept is published
        const isPublished = isPublishedId(DocumentId(broaderConceptOriginalId))
        // add broader as _strengthenOnPublish if it's not published
        skosConcept.broader = [
          {
            _key: uuid(),
            _ref: getPublishedId(DocumentId(broaderConceptId)),
            _type: 'reference',
            _weak: !isPublished,
            _strengthenOnPublish: isPublished
              ? undefined
              : {
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
          if (conceptType === 'topConcept') {
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
    [document.displayed, ident, schemaBaseIri, client, toast, openInNewPane]
  )
  return createConcept
}
