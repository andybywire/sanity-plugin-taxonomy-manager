/* eslint-disable react/require-default-props */
import type {SanityDocument} from '@sanity/client'
import {isVersionId, getVersionNameFromId, type DocumentId} from '@sanity/id-utils'
import {Box, Container, Stack, Text} from '@sanity/ui'
import type {CSSProperties} from 'react'
import type {ReleaseId} from 'sanity'
import {usePerspective} from 'sanity'

import {ReleaseContext, SchemeContext} from '../context'

import {Hierarchy} from './Hierarchy'
import {InputHierarchy} from './inputs'

// Define the specific document structure we expect
interface ConceptSchemeDocument extends SanityDocument {
  displayed: {
    _id: string
    _type: 'skosConceptScheme'
    title?: string
    description?: string
    baseIri?: string
    schemeId?: string
    topConcepts?: Array<{
      _key: string
      _ref: string
      _type: 'reference'
    }>
    concepts?: Array<{
      _key: string
      _ref: string
      _type: 'reference'
    }>
  }
}

// Define the component props interface
export interface TreeViewProps {
  document?: ConceptSchemeDocument
  branchId: string
  selectConcept?: (conceptId: string) => void
  inputComponent?: boolean
}

/**
 * #### Tree View Component Wrapper
 * This is the view component for the hierarchy tree. It is the
 * top level of concept scheme views and is passed into Desk
 * structure to render the primary view for taxonomy documents.
 *
 * @param document - The document to render.
 * @param branchId - The branch ID to fetch concepts from.
 * @param selectConcept - The function to call when a concept is selected.
 * @param inputComponent - Specifies whether the component is Studio
 *    input component, which will hide tree view controls and chrome.
 */
export const TreeView = ({
  document,
  branchId,
  inputComponent = false,
  selectConcept,
}: TreeViewProps) => {
  const containerStyle: CSSProperties = {paddingTop: '1.25rem'}
  const descriptionStyle: CSSProperties = {whiteSpace: 'pre-wrap'}

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const {selectedPerspectiveName} = usePerspective() as {
    selectedPerspectiveName: 'published' | ReleaseId | undefined // undefined denotes draft mode
  }
  // eslint-disable-next-line no-console
  console.log('selectedPerspectiveName', selectedPerspectiveName)

  // // Calculate release context
  // const documentId = document?.displayed._id
  // const isInRelease = isVersionId(documentId as DocumentId)
  // const releaseName = isInRelease
  //   ? getVersionNameFromId(documentId as DocumentId & {__type__: 'versionId'})
  //   : undefined

  // const releaseContext = {
  //   isPublished: selectedPerspectiveName === 'published',
  //   isInRelease,
  //   releaseName,
  //   documentId: documentId || '',
  //   versionId: isInRelease ? documentId : undefined,
  // }

  return (
    // provide document as context for downstream components
    <SchemeContext.Provider value={document}>
      <ReleaseContext.Provider value={selectedPerspectiveName}>
        {inputComponent ? (
          <InputHierarchy
            inputComponent={inputComponent}
            branchId={branchId}
            selectConcept={selectConcept}
          />
        ) : (
          <Container width={1} style={containerStyle}>
            {document?.displayed?.description && (
              <Box padding={4}>
                <Stack space={4}>
                  <Stack space={2}>
                    <Text size={1} weight="semibold">
                      Description 
                    </Text>
                    <Text size={2} muted style={descriptionStyle}>
                      {document?.displayed.description}
                    </Text>
                  </Stack>
                </Stack>
              </Box>
            )}
            <Hierarchy inputComponent={inputComponent} branchId={branchId} />
          </Container>
        )}
      </ReleaseContext.Provider>
    </SchemeContext.Provider>
  )
}

export default TreeView
