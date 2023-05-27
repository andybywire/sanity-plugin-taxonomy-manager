/**
 * Concept Scheme Tree View
 * - Fetches the complete tree of concepts in a concept scheme.
 * - Displays the tree in a nested list.
 * @todo type document, likely via extended SanityDocument type.
 */

import {useCallback, useContext} from 'react'
import {Flex, Spinner, Stack, Box, Text, Inline, Button} from '@sanity/ui'
import {AddIcon} from '@sanity/icons'
import {useListeningQuery} from 'sanity-plugin-utils'
import {useCreateConcept} from '../hooks'
import {trunkBuilder} from '../queries'
import {DocumentConcepts} from '../types'
import {SchemeContext} from './TreeView'
import {TreeStructure} from './TreeStructure'
import {NewScheme} from './guides'

export const Hierarchy = () => {
  const document: any = useContext(SchemeContext) || {}
  const documentId = document.displayed?._id

  const createConcept = useCreateConcept(document)

  const createTopConcept = useCallback(() => {
    createConcept('topConcept')
  }, [createConcept])

  const createEntryConcept = useCallback(() => {
    createConcept('concept')
  }, [createConcept])

  const {data, loading, error} = useListeningQuery<DocumentConcepts>(
    {
      fetch: trunkBuilder(),
      listen: `*[_type == "skosConcept" || _id == $id]`,
    },
    {
      params: {id: documentId},
    }
  )
  if (loading) {
    return (
      <Flex
        align="center"
        direction="column"
        gap={5}
        height="fill"
        justify="center"
        style={{paddingTop: '1rem'}}
      >
        <Spinner muted />
        <Text muted size={1}>
          Loading hierarchy…
        </Text>
      </Flex>
    )
  } else if (error) {
    return <div>error: {error}</div>
  } else if (!data) {
    return <NewScheme document={document} />
  }
  return (
    <Box padding={4}>
      <Stack space={4}>
        <Stack space={2}>
          <Text size={1} weight="semibold">
            Hierarchy Tree
          </Text>
          <Text size={1} muted>
            Hierarchy is determined by the 'Broader' relationships assigned to each concept.
          </Text>
        </Stack>
        {document.displayed?.controls && (
          <Inline space={3}>
            <Button
              tone="primary"
              fontSize={2}
              icon={AddIcon}
              onClick={createTopConcept}
              text="Top Concept"
            />
            <Button
              tone="primary"
              fontSize={2}
              icon={AddIcon}
              onClick={createEntryConcept}
              text="Concept"
            />
          </Inline>
        )}
      </Stack>
      <TreeStructure concepts={data} />
    </Box>
  )
}

export default Hierarchy
