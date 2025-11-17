/* eslint-disable react/require-default-props */
import type {DocumentId} from '@sanity/id-utils'
import {getPublishedId} from '@sanity/id-utils'
import {Flex, Spinner, Box, Text, Card} from '@sanity/ui'
import {useContext} from 'react'
import {useListeningQuery} from 'sanity-plugin-utils'

import {ReleaseContext, SchemeContext, TreeContext} from '../../context'
import {inputBuilder} from '../../queries'
import type {ConceptSchemeDocument, DocumentConcepts, TreeViewProps} from '../../types'
import {TreeStructure} from '../TreeStructure'

/**
 * #### Input Hierarchy Component
 * - Provides a frame for global controls and tree structure
 * - Fetches the complete tree of concepts in a concept scheme.
 * - Displays the tree in a nested list.
 * @param inputComponent - Specifies whether the component is a Studio
 *   input component. Set in HierarchyInput and passed through TreeView
 */
export const InputHierarchy = ({
  branchId = '',
  selectConcept,
  inputComponent,
  expanded,
}: TreeViewProps) => {
  const document: ConceptSchemeDocument = useContext(SchemeContext) || ({} as ConceptSchemeDocument)
  const documentId = getPublishedId(document.displayed?._id as DocumentId)
  const releaseContext: string = useContext(ReleaseContext) as string
  const initialVisibility = expanded ? 'open' : 'closed'
  const {data, loading, error} = useListeningQuery<DocumentConcepts>(
    {
      fetch: inputBuilder(),
      listen: `*[_type == "skosConcept" || _id == $id]`,
    },
    {
      params: {id: documentId, branchId},
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
    console.warn(error)
    return (
      <Box padding={4}>
        <Card padding={[3]} radius={2} shadow={1} tone="caution">
          <Text size={1}>
            There was a problem loading terms. Please check the scheme configuration and try again.
          </Text>
        </Card>
      </Box>
    )
  } else if (!data) {
    return (
      <Box padding={4}>
        <Card padding={[3]} radius={2} shadow={1} tone="caution">
          <Text size={1}>
            This configuration does not have any terms associated with it. Please check the scheme
            and branch supplied and try again.
          </Text>
        </Card>
      </Box>
    )
  }
  return (
    <TreeContext.Provider
      value={{globalVisibility: {treeId: '123', treeVisibility: initialVisibility}}}
    >
      <Box padding={4} paddingTop={0}>
        <TreeStructure
          concepts={data}
          inputComponent={inputComponent || false}
          selectConcept={selectConcept || (() => undefined)}
        />
      </Box>
    </TreeContext.Provider>
  )
}
