/**
 * Concept Scheme Tree View
 * - Fetches the complete tree of concepts in a concept scheme.
 * - Displays the tree in a nested list.
 * @todo add note about random key as way to expand/collapse
 * @todo only show collapse/expand if there are concepts with children
 * @todo type document, likely via extended SanityDocument type.
 */

import {createContext, useCallback, useContext, useState, CSSProperties} from 'react'
import {Flex, Spinner, Stack, Box, Text, Inline, Button, Label} from '@sanity/ui'
import {AddIcon} from '@sanity/icons'
import {randomKey} from '@sanity/util/content'
import {useListeningQuery} from 'sanity-plugin-utils'
import {useCreateConcept} from '../hooks'
import {trunkBuilder} from '../queries'
import {DocumentConcepts} from '../types'
import {SchemeContext} from './TreeView'
import {TreeStructure} from './TreeStructure'
import {NewScheme} from './guides'

export const TreeContext = createContext(null)
const buttonStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
}

type GlobalVisibility = {
  treeId: string
  treeVisibility: string
}

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

  const [globalVisibility, setGlobalVisibility] = useState<GlobalVisibility>({
    treeId: randomKey(3),
    treeVisibility: 'open',
  })

  const handleExpand = useCallback(() => {
    setGlobalVisibility({treeId: randomKey(3), treeVisibility: 'open'})
  }, [])

  const handleCollapse = useCallback(() => {
    setGlobalVisibility({treeId: randomKey(3), treeVisibility: 'closed'})
  }, [])

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
    // @ts-expect-error The compiler complains about this being null.
    // I suspect this is an error.
    <TreeContext.Provider value={globalVisibility}>
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
          <Inline space={3}>
            <button type="button" onClick={handleCollapse} style={buttonStyle}>
              <Label muted size={1}>
                Collapse
              </Label>
            </button>
            <Label muted size={1}>
              |
            </Label>
            <button type="button" onClick={handleExpand} style={buttonStyle}>
              <Label muted size={1}>
                Expand
              </Label>
            </button>
          </Inline>
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
    </TreeContext.Provider>
  )
}

export default Hierarchy
