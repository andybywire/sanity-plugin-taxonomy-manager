import {createContext, CSSProperties} from 'react'
import {Box, Container, Stack, Text} from '@sanity/ui'
import Hierarchy from './Hierarchy'

export const SchemeContext = createContext(null)

/**
 * Tree View Component Wrapper
 * This is the view component for the hierarchy tree. It is the
 * top level of concept scheme views and is passed into Desk
 * structure to render the primary view for taxonomy documents.
 * @todo Extend SanityDocument type to include display properties.
 *       What is the type of the document object returned by the Desk
 *       structure?
 */
export const TreeView = ({
  document,
  branchId,
  inputComponent = false,
  selectConcept,
}: {
  document: any
  branchId: string
  // eslint-disable-next-line react/require-default-props
  inputComponent?: boolean
  selectConcept: any
}) => {
  // console.log('document: ', document)
  // console.log('input component: ', inputComponent)

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
          {document.displayed?.description && (
            <Box padding={4}>
              <Stack space={4}>
                <Stack space={2}>
                  <Text size={1} weight="semibold">
                    Description
                  </Text>
                  <Text size={2} muted style={descriptionStyle}>
                    {document.displayed.description}
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
