/* eslint-disable react/require-default-props */
/**
 *  Hierarchy Component
 * - Provides a frame for global controls and tree structure
 * - Fetches the complete tree of concepts in a concept scheme.
 * - Displays the tree in a nested list.
 * TODO type document, likely via extended SanityDocument type.
 */

import {useCallback, useContext, useState} from 'react'
import {Flex, Spinner, Stack, Box, Text, Inline, Card} from '@sanity/ui'
import {AddCircleIcon, EditIcon} from '@sanity/icons'
import {randomKey} from '@sanity/util/content'
import {useListeningQuery} from 'sanity-plugin-utils'
import {useCreateConcept} from '../hooks'
import {trunkBuilder} from '../queries'
import {DocumentConcepts} from '../types'
import {HierarchyButton} from '../styles'
import {SchemeContext, TreeContext} from '../context'
import {TreeStructure} from './TreeStructure'
import {NewScheme} from './guides'

type GlobalVisibility = {
  treeId: string
  treeVisibility: string
}

export const Hierarchy = ({
  branchId = '',
  selectConcept,
  inputComponent = false,
}: {
  branchId: string
  selectConcept?: any
  inputComponent?: Boolean
}) => {
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

  const [editControls, setEditControls] = useState<Boolean>(false)

  const handleExpand = useCallback(() => {
    setGlobalVisibility({treeId: randomKey(3), treeVisibility: 'open'})
  }, [])

  const handleCollapse = useCallback(() => {
    setGlobalVisibility({treeId: randomKey(3), treeVisibility: 'closed'})
  }, [])

  const handleShowEdit = useCallback(() => {
    setEditControls(true)
  }, [])

  const {data, loading, error} = useListeningQuery<DocumentConcepts>(
    {
      fetch: trunkBuilder(),
      listen: `*[_type == "skosConcept" || _id == $id ]`,
    },
    {
      params: {id: documentId, draft: `drafts.${documentId}`, branchId}, // draft may not be necessary
    }
  )
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
    // @ts-expect-error — The compiler complains about this being null.
    // I suspect this is an error.
    <TreeContext.Provider value={{globalVisibility, editControls}}>
      <Box padding={4} paddingTop={2}>
        <>
          <Stack space={4}>
            <Card borderBottom paddingBottom={1} display={'flex'} flex={1}>
              <Flex justify={'space-between'} flex={1}>
                <Card>
                  {(data.topConcepts?.filter((concept) => (concept?.childConcepts?.length ?? 0) > 0)
                    .length > 0 ||
                    data.orphans?.filter((concept) => (concept?.childConcepts?.length ?? 0) > 0)
                      .length > 0) && (
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
                </Card>
                <Card>
                  {editControls ? (
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
                  ) : (
                    <Inline space={2}>
                      {/* Pick up here: create callback to show edit controls */}
                      {/* Maybe I remove this as part of the document — will it reset on its own */}
                      {/* when it's published? that would be ideal. */}
                      <HierarchyButton type="button" onClick={handleShowEdit}>
                        <Text weight="semibold" muted size={1}>
                          <EditIcon /> Edit
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
            selectConcept={selectConcept}
          />
        </>
      </Box>
    </TreeContext.Provider>
  )
}

export default Hierarchy
