import {AddCircleIcon} from '@sanity/icons/AddCircle'
import type {DocumentId} from '@sanity/id-utils'
import {getPublishedId} from '@sanity/id-utils'
import {Flex, Spinner, Stack, Box, Text, Inline, Card, Button} from '@sanity/ui'
import {nanoid} from 'nanoid'
import {useCallback, useContext, useEffect, useMemo, useState} from 'react'

import {OptimisticTreeContext, SchemeContext, TreeContext, ReleaseContext} from '../context'
import type {ConceptMove} from '../core/tree/moveConcept'
import {isMoveApplied, moveConcept} from '../core/tree/moveConcept'
import {collectConceptIds, pruneConcepts} from '../core/tree/pruneConcepts'
import {useCreateConcept} from '../hooks'
import {useTaxonomyDataPort} from '../seams/TaxonomyPortContext'
import type {ConceptSchemeDocument, DocumentConcepts, TreeViewProps} from '../types'

import {NewScheme} from './guides'
import {TreeStructure} from './TreeStructure'

/** Two pending moves are the same when they describe the same edge and destination. */
function isSameMove(a: ConceptMove, b: ConceptMove): boolean {
  return (
    a.conceptId === b.conceptId &&
    a.fromParentId === b.fromParentId &&
    a.toParentId === b.toParentId
  )
}

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
  // branchId = '',
  selectConcept,
}: TreeViewProps) => {
  const document: ConceptSchemeDocument = useContext(SchemeContext) || ({} as ConceptSchemeDocument)
  const documentId = getPublishedId(document.displayed?._id as DocumentId)
  const releaseContext = useContext(ReleaseContext)

  const port = useTaxonomyDataPort()
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

  // Optimistic removal: prune a removed concept from the tree immediately, then
  // let the live listener reconcile (see core/tree/pruneConcepts). markRemoved is
  // reached by the deep remove actions through OptimisticTreeContext below.
  const [removedIds, setRemovedIds] = useState<Set<string>>(() => new Set())
  const markRemoved = useCallback((id: string) => {
    setRemovedIds((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])
  const unmarkRemoved = useCallback((id: string) => {
    setRemovedIds((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])
  // Optimistic moves: re-parent the tree immediately, then let the live
  // listener reconcile (see core/tree/moveConcept). Held as a list so several
  // drags in quick succession all show, and replayed in the order they were made.
  const [pendingMoves, setPendingMoves] = useState<ConceptMove[]>([])
  const markMoved = useCallback((move: ConceptMove) => {
    setPendingMoves((prev) => [...prev, move])
  }, [])
  const unmarkMoved = useCallback((move: ConceptMove) => {
    setPendingMoves((prev) => prev.filter((pending) => !isSameMove(pending, move)))
  }, [])

  const optimisticValue = useMemo(
    () => ({markRemoved, unmarkRemoved, markMoved, unmarkMoved}),
    [markRemoved, unmarkRemoved, markMoved, unmarkMoved],
  )

  const {data, loading, error} = port.useWatchTree({
    mode: 'trunk',
    documentId,
    perspective: releaseContext,
  })

  // Once fresh data no longer contains a removed id, stop tracking it so the
  // optimistic set self-cleans and never prunes a later re-added concept.
  useEffect(() => {
    setRemovedIds((prev) => {
      if (prev.size === 0) return prev
      const present = collectConceptIds(data)
      const next = new Set([...prev].filter((id) => present.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [data])

  // Once fresh data reflects a move, stop replaying it — otherwise the concept
  // would be moved a second time on top of the listener's own result.
  useEffect(() => {
    setPendingMoves((prev) => {
      if (prev.length === 0) return prev
      const next = prev.filter((move) => !isMoveApplied(data, move))
      return next.length === prev.length ? prev : next
    })
  }, [data])

  const prunedData = useMemo(() => pruneConcepts(data, removedIds), [data, removedIds])
  const treeData = useMemo(
    () =>
      pendingMoves.reduce<DocumentConcepts | null>(
        (tree, move) => moveConcept(tree, move),
        prunedData,
      ),
    [prunedData, pendingMoves],
  )

  const treeContextValue = useMemo(
    () => ({globalVisibility, concepts: treeData}),
    [globalVisibility, treeData],
  )

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
  } else if (!treeData) {
    return <NewScheme document={document} />
  }
  return (
    <TreeContext.Provider value={treeContextValue}>
      <Box padding={4}>
        <>
          <Stack gap={4}>
            <Card borderBottom paddingBottom={1} display={'flex'} flex={1}>
              <Flex justify={'space-between'} flex={1}>
                <Card>
                  {(treeData.topConcepts?.filter(
                    (concept) => (concept?.childConcepts?.length ?? 0) > 0,
                  ).length > 0 ||
                    treeData.concepts?.filter(
                      (concept) => (concept?.childConcepts?.length ?? 0) > 0,
                    ).length > 0) && (
                    <Inline gap={1}>
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
                    <Inline gap={1}>
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
          <OptimisticTreeContext.Provider value={optimisticValue}>
            <TreeStructure
              concepts={treeData}
              inputComponent={inputComponent}
              selectConcept={selectConcept || (() => undefined)}
            />
          </OptimisticTreeContext.Provider>
        </>
      </Box>
    </TreeContext.Provider>
  )
}

export default Hierarchy
