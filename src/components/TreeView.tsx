/* eslint-disable react/require-default-props */
import {Box, Container, Stack, Text} from '@sanity/ui'
import type {CSSProperties} from 'react'
import {usePerspective} from 'sanity'

import {ReleaseContext, SchemeContext} from '../context'
import type {ConceptSchemeDocument, TreeViewProps} from '../types'

import {Hierarchy} from './Hierarchy'
import {InputHierarchy} from './inputs'

/**
 * #### Tree View Component Wrapper
 * This is the view component for the hierarchy tree. It is the
 * top level of concept scheme views and is passed into Desk
 * structure to render the primary view for taxonomy documents.
 * @param document - The document to render.
 * @param branchId - The branch ID to fetch concepts from.
 * @param inputComponent - Specifies whether the component is Studio input component, which will hide tree view controls and chrome.
 * @param selectConcept - The function to call when a concept is selected.
 */
export const TreeView = ({
  document,
  branchId,
  inputComponent = false,
  selectConcept,
}: TreeViewProps) => {
  const containerStyle: CSSProperties = {paddingTop: '1.25rem'}
  const descriptionStyle: CSSProperties = {whiteSpace: 'pre-wrap'}
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
  const {selectedPerspectiveName} = usePerspective()
  return (
    <SchemeContext.Provider value={document || ({} as ConceptSchemeDocument)}>
      {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
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
