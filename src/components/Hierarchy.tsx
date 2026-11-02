import {AddCircleIcon} from '@sanity/icons/AddCircle'
import type {DocumentId} from '@sanity/id-utils'
import {getPublishedId} from '@sanity/id-utils'
import {Flex, Spinner, Stack, Box, Text, Inline, Card, Button} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {nanoid} from 'nanoid'
import {useCallback, useContext, useEffect, useMemo, useState} from 'react'

import {OptimisticTreeContext, SchemeContext, TreeContext, ReleaseContext} from '../context'
import type {ConceptMove} from '../core/tree/moveConcept'
import {isMoveApplied, moveConcept} from '../core/tree/moveConcept'
import {collectDraftConceptIds} from '../core/publicationStatus'
import type {ConceptInsert, RootConceptInsert} from '../core/tree/insertConcept'
import {
  insertConceptInTree,
  insertRootConceptInTree,
  isInsertApplied,
  isRootInsertApplied,
} from '../core/tree/insertConcept'
import {collectConceptIds, pruneConcepts} from '../core/tree/pruneConcepts'
import type {TopConceptChange} from '../core/tree/setTopConcept'
import {isTopConceptApplied, setTopConceptInTree} from '../core/tree/setTopConcept'
import {useCreateConcept} from '../hooks'
import {useTaxonomyDataPort} from '../seams/TaxonomyPortContext'
import type {ConceptSchemeDocument, DocumentConcepts, TreeViewProps} from '../types'

import {NewScheme} from './guides'
import {InsertConceptDialog} from './interactions/InsertConceptDialog'
import type {InsertTarget} from './interactions/InsertConceptDialog'
import {SchemeActionsMenu} from './interactions/SchemeActionsMenu'
import {ConceptDragContext} from './interactions/ConceptDragContext'
import {TreeStructure} from './TreeStructure'

/**
 * One of the tree's add buttons. The label says what will be made — "Top
 * Concept", not "Add Top Concept" — and the tooltip carries the sentence,
 * which is also the accessible name.
 */
function SchemeAddAction({
  text,
  message,
  onClick,
}: {
  text: string
  message: string
  onClick: () => void
}) {
  return (
    <Tooltip
      delay={{open: 750}}
      content={
        <Box padding={1} sizing="content">
          <Text muted size={1}>
            {message}
          </Text>
        </Box>
      }
      fallbackPlacements={['right', 'left']}
      placement="top"
    >
      <Button
        text={text}
        icon={AddCircleIcon}
        mode={'bleed'}
        tone={'positive'}
        paddingY={2}
        onClick={onClick}
        aria-label={message}
      />
    </Tooltip>
  )
}

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

  // The scheme-level insert dialog, opened from the menu beside the add buttons.
  const [insertTarget, setInsertTarget] = useState<InsertTarget | null>(null)
  const openInsertTopConcept = useCallback(() => setInsertTarget({kind: 'topConcept'}), [])
  const openInsertConcept = useCallback(() => setInsertTarget({kind: 'concept'}), [])
  const closeInsert = useCallback(() => setInsertTarget(null), [])

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

  // Optimistic promote/demote: move the row between the tree's two root lists
  // immediately (see core/tree/setTopConcept). Held as a list, like the moves,
  // so a run of changes all show and replay in the order they were made.
  const [pendingTopConcepts, setPendingTopConcepts] = useState<TopConceptChange[]>([])
  const markTopConcept = useCallback((change: TopConceptChange) => {
    setPendingTopConcepts((prev) => [...prev, change])
  }, [])
  const unmarkTopConcept = useCallback((change: TopConceptChange) => {
    setPendingTopConcepts((prev) =>
      prev.filter(
        (pending) =>
          !(pending.conceptId === change.conceptId && pending.isTopConcept === change.isTopConcept),
      ),
    )
  }, [])

  // Optimistic inserts: show an existing concept under its new broader term at
  // once (see core/tree/insertConcept).
  const [pendingInserts, setPendingInserts] = useState<ConceptInsert[]>([])
  const markInserted = useCallback((insert: ConceptInsert) => {
    setPendingInserts((prev) => [...prev, insert])
  }, [])
  const unmarkInserted = useCallback((insert: ConceptInsert) => {
    setPendingInserts((prev) =>
      prev.filter(
        (pending) =>
          !(pending.conceptId === insert.conceptId && pending.parentId === insert.parentId),
      ),
    )
  }, [])

  // Optimistic root inserts: an existing concept joining the scheme's top
  // concepts, or its root concepts (see core/tree/insertConcept).
  const [pendingRootInserts, setPendingRootInserts] = useState<RootConceptInsert[]>([])
  const markRootInserted = useCallback((insert: RootConceptInsert) => {
    setPendingRootInserts((prev) => [...prev, insert])
  }, [])
  const unmarkRootInserted = useCallback((insert: RootConceptInsert) => {
    setPendingRootInserts((prev) =>
      prev.filter(
        (pending) =>
          !(pending.conceptId === insert.conceptId && pending.asTopConcept === insert.asTopConcept),
      ),
    )
  }, [])

  const optimisticValue = useMemo(
    () => ({
      markRemoved,
      unmarkRemoved,
      markMoved,
      unmarkMoved,
      markTopConcept,
      unmarkTopConcept,
      markInserted,
      unmarkInserted,
      markRootInserted,
      unmarkRootInserted,
    }),
    [
      markRemoved,
      unmarkRemoved,
      markMoved,
      unmarkMoved,
      markTopConcept,
      unmarkTopConcept,
      markInserted,
      unmarkInserted,
      markRootInserted,
      unmarkRootInserted,
    ],
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

  // Once fresh data reflects a promotion or demotion, stop replaying it.
  useEffect(() => {
    setPendingTopConcepts((prev) => {
      if (prev.length === 0) return prev
      const next = prev.filter((change) => !isTopConceptApplied(data, change))
      return next.length === prev.length ? prev : next
    })
  }, [data])

  // Once fresh data reflects an insert, stop replaying it.
  useEffect(() => {
    setPendingInserts((prev) => {
      if (prev.length === 0) return prev
      const next = prev.filter((insert) => !isInsertApplied(data, insert))
      return next.length === prev.length ? prev : next
    })
  }, [data])

  // Once fresh data reflects a root insert, stop replaying it.
  useEffect(() => {
    setPendingRootInserts((prev) => {
      if (prev.length === 0) return prev
      const next = prev.filter((insert) => !isRootInsertApplied(data, insert))
      return next.length === prev.length ? prev : next
    })
  }, [data])

  const prunedData = useMemo(() => pruneConcepts(data, removedIds), [data, removedIds])
  const treeData = useMemo(() => {
    const moved = pendingMoves.reduce<DocumentConcepts | null>(
      (tree, move) => moveConcept(tree, move),
      prunedData,
    )
    const reclassified = pendingTopConcepts.reduce<DocumentConcepts | null>(
      (tree, change) => setTopConceptInTree(tree, change),
      moved,
    )
    const inserted = pendingInserts.reduce<DocumentConcepts | null>(
      (tree, insert) => insertConceptInTree(tree, insert),
      reclassified,
    )
    return pendingRootInserts.reduce<DocumentConcepts | null>(
      (tree, insert) => insertRootConceptInTree(tree, insert),
      inserted,
    )
  }, [prunedData, pendingMoves, pendingTopConcepts, pendingInserts, pendingRootInserts])

  // Publication markers are off in an input tree, which browses published
  // concepts in a published scheme, and in a release, where the comparable
  // thing is the release version rather than a draft. Gating is an empty id
  // list: the query then matches nothing and its listener never fires.
  const showsPublicationStatus = !inputComponent && releaseContext === undefined
  // Only the drafted concepts: every other node in the tree is its own
  // published document, so asking about it would be dead weight (see
  // `collectDraftConceptIds`). Sorted, because the id list is a query parameter
  // and `useListeningQuery` memoizes params by their JSON — an unstable order
  // would resubscribe the listener on every tree update.
  const publishedQueryIds = useMemo(
    () => (showsPublicationStatus ? [...collectDraftConceptIds(treeData)].sort() : []),
    [showsPublicationStatus, treeData],
  )
  const {data: publishedIds} = port.useWatchPublishedConcepts({ids: publishedQueryIds})

  const treeContextValue = useMemo(
    () => ({
      globalVisibility,
      concepts: treeData,
      publishedIds: showsPublicationStatus ? publishedIds : undefined,
    }),
    [globalVisibility, treeData, showsPublicationStatus, publishedIds],
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
                      <SchemeAddAction
                        text="Top Concept"
                        message="Add a new concept as a top concept of this scheme"
                        onClick={createTopConcept}
                      />
                      <SchemeAddAction
                        text="Concept"
                        message="Add a new concept to this scheme"
                        onClick={createEntryConcept}
                      />
                      <SchemeActionsMenu
                        onInsertTopConcept={openInsertTopConcept}
                        onInsertConcept={openInsertConcept}
                      />
                    </Inline>
                  )}
                </Card>
              </Flex>
            </Card>
          </Stack>
          <OptimisticTreeContext.Provider value={optimisticValue}>
            {/* Inside the provider: the dialog's hook marks the optimistic
                insert, and outside it that mark is a no-op. */}
            {insertTarget && <InsertConceptDialog target={insertTarget} onClose={closeInsert} />}
            <ConceptDragContext>
              <TreeStructure
                concepts={treeData}
                inputComponent={inputComponent}
                selectConcept={selectConcept || (() => undefined)}
              />
            </ConceptDragContext>
          </OptimisticTreeContext.Provider>
        </>
      </Box>
    </TreeContext.Provider>
  )
}

export default Hierarchy
