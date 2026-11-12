import type {DocumentId} from '@sanity/id-utils'
import {getPublishedId} from '@sanity/id-utils'
import {Box, Button, Card, Flex, Inline, Spinner, Stack, Text, useTheme_v2} from '@sanity/ui'
import {nanoid} from 'nanoid'
import {useCallback, useContext, useMemo, useState} from 'react'

import {ReleaseContext, SchemeContext, TreeContext} from '../../context'
import {collectConceptIds} from '../../core/tree/pruneConcepts'
import {usageMax as computeUsageMax} from '../../core/usage'
import {useTaxonomyDataPort} from '../../seams/TaxonomyPortContext'
import type {ConceptSchemeDocument} from '../../types'
import {NewScheme} from '../guides'

import {StatsStructure} from './StatsStructure'
import {COUNT_WIDTH, TRACK_WIDTH} from './lane'

/**
 * #### Stats Hierarchy
 * The governance view's frame: the header, the two queries behind it, and the
 * tree of rows.
 *
 * Reads the same tree the Tree View reads, through the same port member, so
 * the hierarchy is the one the editor already knows rather than a second
 * rendering of it. The counts are a second watch alongside, scoped to the ids
 * that tree is showing — the shape `useWatchPublishedConcepts` established.
 *
 * No optimistic layer and no drag context: the view is read-only, so there is
 * nothing to replay ahead of the listener.
 */
export const StatsHierarchy = () => {
  const document: ConceptSchemeDocument = useContext(SchemeContext) || ({} as ConceptSchemeDocument)
  const documentId = getPublishedId(document.displayed?._id as DocumentId)
  const releaseContext = useContext(ReleaseContext)
  const {space} = useTheme_v2()

  const port = useTaxonomyDataPort()

  // Expand & collapse. A fresh treeId remounts every row, which re-initializes
  // the per-row toggle state — the mechanism the Tree View uses, kept identical
  // so the two headers behave the same way.
  const [globalVisibility, setGlobalVisibility] = useState<{
    treeId: string
    treeVisibility: 'open' | 'closed'
  }>({treeId: nanoid(6), treeVisibility: 'open'})
  const handleExpand = useCallback(() => {
    setGlobalVisibility({treeId: nanoid(6), treeVisibility: 'open'})
  }, [])
  const handleCollapse = useCallback(() => {
    setGlobalVisibility({treeId: nanoid(6), treeVisibility: 'closed'})
  }, [])

  const {
    data: treeData,
    loading,
    error,
  } = port.useWatchTree({
    mode: 'trunk',
    documentId,
    perspective: releaseContext,
  })

  // Sorted, because the id list is a query parameter and `useListeningQuery`
  // memoizes params by their JSON — an unstable order would resubscribe the
  // listener on every tree update.
  const usageQueryIds = useMemo(() => [...collectConceptIds(treeData)].sort(), [treeData])
  const {data: usage} = port.useWatchConceptUsage({
    ids: usageQueryIds,
    perspective: releaseContext,
  })

  // The scale is the busiest term in the scheme, so it does not shift as
  // branches are expanded and collapsed.
  const usageMax = useMemo(() => (usage ? computeUsageMax(usage) : 0), [usage])

  const treeContextValue = useMemo(
    () => ({globalVisibility, concepts: treeData, usage, usageMax}),
    [globalVisibility, treeData, usage, usageMax],
  )

  // The header label sits over the measure lane, built from the lane's own
  // widths so the two cannot drift apart.
  const laneWidth = COUNT_WIDTH + space[3] + TRACK_WIDTH

  const hasBranches =
    (treeData?.topConcepts?.filter((concept) => (concept?.childConcepts?.length ?? 0) > 0).length ??
      0) > 0 ||
    (treeData?.concepts?.filter((concept) => (concept?.childConcepts?.length ?? 0) > 0).length ??
      0) > 0

  // `loading` only means a fetch is in flight, and it is true on every mount —
  // including one the cache has already filled. Gating the spinner on there
  // being nothing to show is what turns that cache into a visible difference:
  // a tab switch keeps the tree on screen while the listener catches up.
  if (loading && !treeData) {
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
  }
  if (error) {
    console.error(error)
    return (
      <Box padding={4}>
        <Text size={1}>There was an error loading this scheme.</Text>
      </Box>
    )
  }
  if (!treeData) {
    return <NewScheme document={document} />
  }

  return (
    <TreeContext.Provider value={treeContextValue}>
      <Box padding={4}>
        <Stack gap={4}>
          <Card borderBottom paddingBottom={1} display={'flex'} flex={1}>
            <Flex justify={'space-between'} align="center" flex={1}>
              {/* Always rendered, hidden when there is nothing to collapse.
                  These buttons are the tallest thing in the header, so leaving
                  them out shrinks it and the rule rides up against the column
                  label — a flat scheme's header sat noticeably tighter than a
                  nested one's. Holding the slot open with the controls
                  themselves is the same move the row makes for its caret, and
                  for the same reason: the height is theirs to state, not ours
                  to measure. */}
              <Card>
                <Inline
                  gap={1}
                  aria-hidden={hasBranches ? undefined : 'true'}
                  style={hasBranches ? undefined : {visibility: 'hidden'}}
                >
                  <Button
                    text={'Collapse'}
                    paddingY={2}
                    mode={'bleed'}
                    onClick={handleCollapse}
                    tabIndex={hasBranches ? undefined : -1}
                  />
                  <Text weight="semibold" muted size={1}>
                    |
                  </Text>
                  <Button
                    text={'Expand'}
                    paddingY={2}
                    mode={'bleed'}
                    onClick={handleExpand}
                    tabIndex={hasBranches ? undefined : -1}
                  />
                </Inline>
              </Card>
              {/* Right-aligned to the lane's own right edge, which is the bar
                  track's. Anchored left it floated over the gap between the
                  count column and the bars and read as belonging to neither;
                  the counts are right-justified, so the lane has a right edge
                  and nothing else to hang a label on. */}
              <Box style={{width: laneWidth, flexShrink: 0, textAlign: 'right'}}>
                <Text size={1} weight="semibold" muted>
                  Tagged Resources
                </Text>
              </Box>
            </Flex>
          </Card>
        </Stack>
        <StatsStructure concepts={treeData} />
      </Box>
    </TreeContext.Provider>
  )
}
