/* eslint-disable react/require-default-props */
import {CSSProperties} from 'react'
import {Box, Container, Stack, Text} from '@sanity/ui'
import Hierarchy from './Hierarchy'
import {SchemeContext} from '../context'

/**
 * Tree View Component Wrapper
 * This is the view component for the hierarchy tree. It is the
 * top level of concept scheme views and is passed into Desk
 * structure to render the primary view for taxonomy documents.
 * TODO: Extend SanityDocument type to include display properties.
 *       What is the type of the document object returned by the Desk
 *       structure?
 */
export const TreeView = ({
  document,
  branchId,
  selectConcept,
  inputComponent = false,
}: {
  document: any
  branchId: string
  selectConcept: any
  inputComponent?: boolean
}) => {
  const containerStyle: CSSProperties = {paddingTop: '1.25rem'}
  const descriptionStyle: CSSProperties = {whiteSpace: 'pre-wrap'}

  return (
    <SchemeContext.Provider value={document}>
      {inputComponent ? (
        <Hierarchy
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
