import {Container, Stack, Box, Text} from '@sanity/ui'
import Hierarchy from './Hierarchy'
import { DocumentVersionsCollection } from '../types'

export const TreeView = ({document, documentId}: {document: DocumentVersionsCollection, documentId: string}) => {
  return (
    <Container
      width={1}
      style={{paddingTop: '1.25rem'}}
      onResize={undefined}
      onResizeCapture={undefined}
    >
      <Box padding={4} onResize={undefined} onResizeCapture={undefined}>
        <Stack space={2}>
          <Text size={1} weight="semibold" onResize={undefined} onResizeCapture={undefined}>
            Hierarchy Tree
          </Text>
          <Text size={1} muted={true} onResize={undefined} onResizeCapture={undefined}>
            Concept hierarchy is determined by 'Broader' relationships assigned to each concept.
          </Text>
          <Hierarchy document={document} documentId={documentId} />
        </Stack>
      </Box>
    </Container>
  )
}

export default TreeView
