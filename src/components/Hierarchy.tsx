/**
 *  Hierarchy Component
 * - Provides a frame for global controls and tree structure
 * - Fetches the complete tree of concepts in a concept scheme.
 * - Displays the tree in a nested list.
 * @todo type document, likely via extended SanityDocument type.
 */

import {createContext, useCallback, useContext, useState} from 'react'
import {Flex, Spinner, Stack, Box, Text, Inline} from '@sanity/ui'
import {AddCircleIcon} from '@sanity/icons'
import {randomKey} from '@sanity/util/content'
import {useListeningQuery} from 'sanity-plugin-utils'
import {useCreateConcept} from '../hooks'
import {trunkBuilder} from '../queries'
import {DocumentConcepts} from '../types'
import {HierarchyButton} from '../styles'
import {SchemeContext} from './TreeView'
import {TreeStructure} from './TreeStructure'
import {NewScheme} from './guides'

export const TreeContext = createContext(null)

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

  // `randomKey` is used on treeId to initiate a re-rendering of all child
  // elements on expand/collapse and re-initialize any local toggle state
  // that had been set.
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
    // @ts-expect-error — The compiler complains about this being null.
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
          <Inline space={4}>
            {(data.topConcepts?.filter((concept) => (concept?.childConcepts?.length ?? 0) > 0)
              .length > 0 ||
              data.orphans?.filter((concept) => (concept?.childConcepts?.length ?? 0) > 0).length >
                0) && (
              <Inline space={2}>
                <HierarchyButton type="button" onClick={handleCollapse}>
                  <Text weight="semibold" muted size={1}>
                    Collapse
                  </Text>
                </HierarchyButton>
                <Text weight="semibold" muted size={1}>
                  |
                </Text>
                <HierarchyButton type="button" onClick={handleExpand}>
                  <Text weight="semibold" muted size={1}>
                    Expand
                  </Text>
                </HierarchyButton>
              </Inline>
            )}
            {document.displayed?.controls && (
              <Inline space={4}>
                <HierarchyButton type="button" className="add" onClick={createTopConcept}>
                  <Text weight="semibold" muted size={1}>
                    <AddCircleIcon /> Add Top Concept
                  </Text>
                </HierarchyButton>
                <HierarchyButton type="button" className="add" onClick={createEntryConcept}>
                  <Text weight="semibold" muted size={1}>
                    <AddCircleIcon /> Add Concept
                  </Text>
                </HierarchyButton>
              </Inline>
            )}
          </Inline>
        </Stack>
        <TreeStructure concepts={data} />
      </Box>
    </TreeContext.Provider>
  )
}

export default Hierarchy
