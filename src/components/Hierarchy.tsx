import {AddCircleIcon} from '@sanity/icons'
import type {DocumentId} from '@sanity/id-utils'
import {getPublishedId} from '@sanity/id-utils'
import {Flex, Spinner, Stack, Box, Text, Inline, Card} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {useCallback, useContext, useState} from 'react'
import {useListeningQuery} from 'sanity-plugin-utils'

import {SchemeContext, TreeContext, ReleaseContext} from '../context'
import {useCreateConcept} from '../hooks'
import {trunkBuilder} from '../queries'
import {HierarchyButton} from '../styles'
import type {DocumentConcepts} from '../types'

import {NewScheme} from './guides'
import {TreeStructure} from './TreeStructure'
import type {ConceptSchemeDocument, TreeViewProps} from './TreeView'

/**
 * #### Hierarchy Component
 * - Provides a frame for global controls and tree structure
 * - Fetches the complete tree of concepts in a concept scheme.
 * - Displays the tree in a nested list.
 * - Displays controls to add concepts or top concepts when in draft mode or release mode.
 * @param inputComponent - Whether this is an input component.
 * @param branchId - Input component: The branch ID to fetch concepts from.
 * @param selectConcept - Input component: The function to call when a concept is selected.
 */
export const Hierarchy = ({
  inputComponent = false,
  branchId = '',
  selectConcept,
}: TreeViewProps) => {
  const document: ConceptSchemeDocument = useContext(SchemeContext) || ({} as ConceptSchemeDocument)
  const documentId = getPublishedId(document.displayed?._id as DocumentId)
  const releaseContext: string = useContext(ReleaseContext) as string

  const createConcept = useCreateConcept(document)
  const createTopConcept = useCallback(() => {
    createConcept('topConcept')
  }, [createConcept])
  const createEntryConcept = useCallback(() => {
    createConcept('concept')
  }, [createConcept])

  // `uuid()` is used on treeId to initiate a re-rendering of all child
  // elements on expand/collapse and re-initialize any local toggle state
  // that had been set.
  const [globalVisibility, setGlobalVisibility] = useState({
    treeId: uuid(),
    treeVisibility: 'open',
  })
  const handleExpand = useCallback(() => {
    setGlobalVisibility({treeId: uuid(), treeVisibility: 'open'})
  }, [])
  const handleCollapse = useCallback(() => {
    setGlobalVisibility({treeId: uuid(), treeVisibility: 'closed'})
  }, [])

  const {data, loading, error} = useListeningQuery<DocumentConcepts>(
    {
      fetch: trunkBuilder(),
      listen: `*[_type == "skosConcept" || _id == $id ]`,
    },
    {
      params: {
        id: documentId,
        branchId,
      },
      options: {
        perspective: releaseContext === undefined ? 'drafts' : [releaseContext],
      },
    }
  ) as {data: DocumentConcepts; loading: boolean; error: Error | null}
  if (loading) {
    return (
      <Box padding={5}>
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
      </Box>
    )
  } else if (error) {
    console.error(error)
    return <div>Error here</div>
  } else if (!data) {
    return <NewScheme document={document} />
  }
  return (
    <TreeContext.Provider value={{globalVisibility}}>
      <Box padding={4} paddingTop={2}>
        <>
          <Stack space={4}>
            <Card borderBottom paddingBottom={1} display={'flex'} flex={1}>
              <Flex justify={'space-between'} flex={1}>
                <Card>
                  {(data.topConcepts?.filter((concept) => (concept?.childConcepts?.length ?? 0) > 0)
                    .length > 0 ||
                    data.concepts?.filter((concept) => (concept?.childConcepts?.length ?? 0) > 0)
                      .length > 0) && (
                    <Inline space={1}>
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
                </Card>
                <Card>
                  {releaseContext !== 'published' && (
                    <Inline space={1}>
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
                </Card>
              </Flex>
            </Card>
          </Stack>
          <TreeStructure
            concepts={data}
            inputComponent={inputComponent}
            selectConcept={selectConcept || (() => undefined)}
          />
        </>
      </Box>
    </TreeContext.Provider>
  )
}

export default Hierarchy
