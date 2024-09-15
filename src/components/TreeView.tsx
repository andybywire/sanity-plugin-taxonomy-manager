/* eslint-disable react/require-default-props */
import {CSSProperties} from 'react'
import {Box, Container, Stack, Text} from '@sanity/ui'
import Hierarchy from './Hierarchy'
import {InputHierarchy} from './inputs'
import {SchemeContext} from '../context'

/**
 * #### Tree View Component Wrapper
 * This is the view component for the hierarchy tree. It is the
 * top level of concept scheme views and is passed into Desk
 * structure to render the primary view for taxonomy documents.
 * @param inputComponent - Specifies whether the component is Studio
 *    input component, which will hide tree view controls and chrome.
 */
export const TreeView = ({
  document,
  branchId,
  selectConcept,
  inputComponent = false,
}: {
  document: any // contains document.displayed, the applicable skosConceptScheme
  branchId: string // used to narrow to a branch for the HierarchyInput component
  selectConcept: any // HierarchyInput component select action
  inputComponent?: boolean
}) => {
  const containerStyle: CSSProperties = {paddingTop: '1.25rem'}
  const descriptionStyle: CSSProperties = {whiteSpace: 'pre-wrap'}

  return (
    // provide document as context for downstream components
    <SchemeContext.Provider value={document}>
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
    </SchemeContext.Provider>
  )
}

export default TreeView
