import {Container, Stack, Box, Text} from '@sanity/ui'
import Hierarchy from './Hierarchy'

export const TreeView = ({documentId}: {documentId: string}) => {
  return (
    <Container width={1} style={{paddingTop: '1.25rem'}}>
      <Box padding={4}>
        <Stack space={2}>
          <Text size={1} weight="semibold">
            Hierarchy Tree
          </Text>
          <Text size={1} muted>
            Concept hierarchy is determined by 'Broader' relationships assigned to each concept.
          </Text>
          <Hierarchy documentId={documentId} />
        </Stack>
      </Box>
    </Container>
  )
}

export default TreeView
