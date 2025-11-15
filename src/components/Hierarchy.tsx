import {AddCircleIcon} from '@sanity/icons'
import type {DocumentId} from '@sanity/id-utils'
import {getPublishedId} from '@sanity/id-utils'
import {Flex, Spinner, Stack, Box, Text, Inline, Card, Button} from '@sanity/ui'
import {nanoid} from 'nanoid'
import {useCallback, useContext, useState} from 'react'
import {useListeningQuery} from 'sanity-plugin-utils'

import {SchemeContext, TreeContext, ReleaseContext} from '../context'
import {useCreateConcept} from '../hooks'
import {trunkBuilder} from '../queries'
import type {DocumentConcepts, ConceptSchemeDocument, TreeViewProps} from '../types'

import {NewScheme} from './guides'
import {TreeStructure} from './TreeStructure'

/**
 * #### Hierarchy Component
 * Provides a frame for global controls and tree structure and displays
 * controls to add concepts or top concepts when in draft mode or release mode.
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

  // Expand & Collapse Controls
  // short IDs are used on treeId to initiate a re-rendering of all child
  // elements on expand/collapse and re-initialize any local toggle state
  // that had been set.
  const [globalVisibility, setGlobalVisibility] = useState<{
    treeId: string
    treeVisibility: 'open' | 'closed'
  }>({
    treeId: nanoid(6),
    treeVisibility: 'open',
  })
  const handleExpand = useCallback(() => {
    setGlobalVisibility({treeId: nanoid(6), treeVisibility: 'open'})
  }, [])
  const handleCollapse = useCallback(() => {
    setGlobalVisibility({treeId: nanoid(6), treeVisibility: 'closed'})
  }, [])

  const {data, loading, error} = useListeningQuery<DocumentConcepts>(
    {
      fetch: trunkBuilder(),
      listen: `*[_type == "skosConcept" || _type == "skosConceptScheme" ]`,
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
      <Box padding={4} paddingTop={6}>
        <Flex align="center" direction="column" gap={5} height="fill" justify="center">
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
      <Box padding={4}>
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
                      <Button
                        text={'Collapse'}
                        paddingY={2}
                        mode={'bleed'}
                        onClick={handleCollapse}
                      />
                      <Text weight="semibold" muted size={1}>
                        |
                      </Text>
                      <Button text={'Expand'} paddingY={2} mode={'bleed'} onClick={handleExpand} />
                    </Inline>
                  )}
                </Card>
                <Card>
                  {releaseContext !== 'published' && (
                    <Inline space={1}>
                      <Button
                        text={'Add Top Concept'}
                        icon={AddCircleIcon}
                        mode={'bleed'}
                        tone={'positive'}
                        paddingY={2}
                        onClick={createTopConcept}
                      />
                      <Button
                        text={'Add Concept'}
                        icon={AddCircleIcon}
                        mode={'bleed'}
                        tone={'positive'}
                        paddingY={2}
                        onClick={createEntryConcept}
                      />
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
