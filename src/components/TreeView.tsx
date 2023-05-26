/**
 * Tree View
 * This is the view component for the hierarchy tree. It is passed
 * into Desk structure and is used to render the primary view for
 * taxonomy documents.
 */

import {Box, Container, Stack, Text} from '@sanity/ui'
import Hierarchy from './Hierarchy'
import {createContext} from 'react'
import {CSSProperties} from 'react'

// Need to pass into this component:
// - documentId with draft status ✔︎
// - baseUri ✔︎
// – show new concepts in draft mode (and note that they need to be published — not this on a tool tip on "Untitled")
// - update tree when new concepts (draft) are published ✔︎
// - properly type the document that's passed in ✔︎
// - add 'unpublished' badge to newly added concepts not yet published
// - disable add concept at 5th level; add info icon and tooltip message (or AccessDeniedIcon)
// - on delete (RemoveCircleIcon), remove from tree and add message in toast: "Concept removed from concept scheme, but not deleted from your concept store. [View Concept] to delete or modify"

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
