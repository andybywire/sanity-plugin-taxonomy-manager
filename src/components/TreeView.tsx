/**
 * Tree View
 * This is the view component for the hierarchy tree. It is the
 * top level of concept scheme views and is passed into Desk
 * structure to render the primary view for taxonomy documents.
 */

import {createContext, CSSProperties} from 'react'
import {Box, Container, Stack, Text} from '@sanity/ui'
import Hierarchy from './Hierarchy'

export const SchemeContext = createContext(null)

export const TreeView = ({document}: {document: any}) => {
  const containerStyle: CSSProperties = {paddingTop: '1.25rem'}
  const descriptionStyle: CSSProperties = {whiteSpace: 'pre-wrap'}
  return (
    <SchemeContext.Provider value={document}>
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
        <Hierarchy />
      </Container>
    </SchemeContext.Provider>
  )
}

export default TreeView
