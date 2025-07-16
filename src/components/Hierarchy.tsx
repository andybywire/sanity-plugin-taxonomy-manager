/* eslint-disable react/require-default-props */
import {AddCircleIcon} from '@sanity/icons'
// Removed unused imports from @sanity/id-utils
import {Flex, Spinner, Stack, Box, Text, Inline, Card} from '@sanity/ui'
import {randomKey} from '@sanity/util/content'
import {useCallback, useContext, useState} from 'react'
import {useListeningQuery} from 'sanity-plugin-utils'

import {SchemeContext, TreeContext, ReleaseContext} from '../context'
import {useCreateConcept} from '../hooks'
import {trunkBuilder} from '../queries'
import {HierarchyButton} from '../styles'
import type {DocumentConcepts} from '../types'

import {NewScheme} from './guides'
import {TreeStructure} from './TreeStructure'
import type {TreeViewProps} from './TreeView'

/**
 * #### Hierarchy Component
 * - Provides a frame for global controls and tree structure
 * - Fetches the complete tree of concepts in a concept scheme.
 * - Displays the tree in a nested list.
 * - Displays controls to add concepts or top concepts when in draft mode or release mode.
 *
 * @param branchId - The branch ID to fetch concepts from.
 * @param selectConcept - The function to call when a concept is selected.
 * @param inputComponent - Whether this is an input component.
 */
export const Hierarchy = ({
  branchId = '',
  selectConcept,
  inputComponent = false,
}: TreeViewProps) => {
  const document: any = useContext(SchemeContext) || {}
  const documentId = document.displayed?._id
  const releaseContext = useContext(ReleaseContext)

  console.log('document id', documentId) // this is grabbing the document with the release version

  /**
   * Need to account for release versions below
   * I may be able to simplify this a lot, now that Top Concept is
   * not represented at the _term_ level, but at the _scheme_ level.
   * 🚨 this is where the next issue is — I'm constructing these lists and passing them in (this is
   * where the version stuff is getting lost)
   * - reformulate this to be based on the document ID
   * - look into GROQ functions
   */

  const conceptIds = document.displayed?.concepts?.map((concept: any) => concept?._ref) || []
  const draftConceptIds =
    document.displayed?.concepts?.map((concept: any) => `drafts.${concept?._ref}`) || []
  const topConceptIds = document.displayed?.topConcepts?.map((concept: any) => concept?._ref) || []
  const draftTopConceptIds =
    document.displayed?.topConcepts?.map((concept: any) => `drafts.${concept?._ref}`) || []

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
  const [globalVisibility, setGlobalVisibility] = useState({
    treeId: randomKey(3),
    treeVisibility: 'open',
  })

  // Determine if we should show edit controls based on perspective
  const isEditable = releaseContext !== 'published'

  const handleExpand = useCallback(() => {
    setGlobalVisibility({treeId: randomKey(3), treeVisibility: 'open'})
  }, [])

  const handleCollapse = useCallback(() => {
    setGlobalVisibility({treeId: randomKey(3), treeVisibility: 'closed'})
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
        conceptIds,
        draftConceptIds,
        topConceptIds,
        draftTopConceptIds,
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
                    data.orphans?.filter((concept) => (concept?.childConcepts?.length ?? 0) > 0)
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
                  {isEditable && (
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
            selectConcept={selectConcept}
          />
        </>
      </Box>
    </TreeContext.Provider>
  )
}

export default Hierarchy
