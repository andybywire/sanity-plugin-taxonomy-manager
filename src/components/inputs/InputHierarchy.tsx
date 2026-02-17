/* eslint-disable react/require-default-props */
import type {DocumentId} from '@sanity/id-utils'
import {getPublishedId} from '@sanity/id-utils'
import {Flex, Spinner, Box, Text, Card} from '@sanity/ui'
import {nanoid} from 'nanoid'
import {useCallback, useContext, useMemo} from 'react'
import {useListeningQuery} from 'sanity-plugin-utils'

import {ReleaseContext, SchemeContext, TreeContext} from '../../context'
import {inputBuilder} from '../../queries'
import type {
  ChildConceptTerm,
  ConceptSchemeDocument,
  DocumentConcepts,
  TreeViewProps,
} from '../../types'
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
  conceptRecs,
  recsError,
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
      params: {id: documentId, branchId: branchId ?? ''},
      options: {
        perspective: releaseContext === undefined ? 'drafts' : [releaseContext],
      },
    }
  ) as {data: DocumentConcepts; loading: boolean; error: Error | null}

  // Build a score lookup map from conceptRecs:
  const scoreMap = useMemo(() => {
    const map = new Map<string, number>()
    if (Array.isArray(conceptRecs)) {
      for (const rec of conceptRecs) {
        map.set(rec.value.documentId, rec.score)
      }
    }
    return map
  }, [conceptRecs])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const treeId = useMemo(() => nanoid(6), [scoreMap])

  // Recursively annotate tree nodes
  // Walk the tree creating new objects with score attached where
  // there's a match. Use getPublishedId() to normalize the tree
  // node id before comparing against the lookup map.
  // Process children first, then check if any child has score
  // or hasMatchingDescendant.
  const addScores = useCallback(function addScores<T extends ChildConceptTerm>(
    node: T,
    scores: Map<string, number>
  ): T {
    const publishedId = getPublishedId(node.id as DocumentId)
    const score = scores.get(publishedId)

    const annotatedChildren = node.childConcepts?.map((c) => addScores(c, scores))

    const hasMatchingDescendant =
      annotatedChildren?.some((c) => c.score !== undefined || c.hasMatchingDescendant) ?? false

    return {
      ...node,
      ...(score === undefined ? {} : {score}),
      ...(hasMatchingDescendant ? {hasMatchingDescendant: true} : {}),
      ...(annotatedChildren ? {childConcepts: annotatedChildren} : {}),
    } as T
  },
  [])

  // Compute merged data with useMemo:
  const mergedData = useMemo(() => {
    if (!data || scoreMap.size === 0 || recsError) return data
    return {
      topConcepts: data.topConcepts?.map((tc) => addScores(tc, scoreMap)),
      concepts: data.concepts?.map((c) => addScores(c, scoreMap)),
    }
  }, [addScores, data, scoreMap, recsError])

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
    <TreeContext.Provider value={{globalVisibility: {treeId, treeVisibility: initialVisibility}}}>
      <Box padding={4} paddingTop={0}>
        {recsError && (
          <Card marginTop={2} padding={3} radius={2} shadow={1} tone="caution">
            <Text size={2}>{recsError}</Text>
          </Card>
        )}
        <TreeStructure
          concepts={mergedData}
          inputComponent={inputComponent || false}
          selectConcept={selectConcept || (() => undefined)}
        />
      </Box>
    </TreeContext.Provider>
  )
}
