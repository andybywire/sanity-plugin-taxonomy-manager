import {Box, Card, Flex, Text} from '@sanity/ui'
import {useCallback, useContext, useState} from 'react'

import {ReleaseContext, SchemeContext, TreeContext} from '../../context'
import {reservesGripSlot} from '../../core/rowScaffolding'
import {MAX_VISIBLE_LEVEL} from '../../core/tree/moveConcept'
import {hasRootOrphans} from '../../core/tree/rootOrphans'
import type {ChildConceptTerm, ConceptSchemeDocument} from '../../types'
import {ConceptDetailLink} from '../interactions/ConceptDetailLink'
import {ConceptDragHandle} from '../interactions/ConceptDragHandle'
import {ToggleButton} from '../interactions/ToggleButton'

import {StatsChildConcepts} from './StatsChildConcepts'
import {UsageBar} from './UsageBar'
import {COUNT_WIDTH} from './lane'

/**
 * Where a row sits in the scheme. The same three kinds the Tree View's row
 * takes, minus everything that only mattered for editing: a governance row
 * cannot move, promote, demote or be removed, so `kind` decides two things
 * here — whether the label is bold, and which badge it carries.
 */
export type StatsRowKind = 'top' | 'orphan' | 'child'

/**
 * #### Stats Row
 * One row of the governance view: a caret, a label, a count and a bar.
 *
 * Deliberately a separate component from `ConceptRow` rather than a mode on
 * it. That row carries drag-and-drop, a row menu, three dialogs and the
 * optimistic-edit context, none of which a read-only view wants, and threading
 * a flag through all of it would put the plugin's most complex component in
 * the path of its simplest view. What the two share, they share by using the
 * same pieces — `ToggleButton`, `ConceptDetailLink`, `useControlWidth` — so
 * the row anatomy stays common where it is actually common.
 *
 * **The row is not a button.** The label is, and the count and bar sit beside
 * it as siblings. Wrapping the lot in a button would be a control containing
 * controls, which is invalid and unusable with a keyboard — and the deferred
 * per-row overflow menu would have to break it open again.
 */
export const StatsRow = ({concept, kind}: {concept: ChildConceptTerm; kind: StatsRowKind}) => {
  const document: ConceptSchemeDocument = useContext(SchemeContext) || ({} as ConceptSchemeDocument)
  const releaseContext = useContext(ReleaseContext)
  const {
    globalVisibility: {treeVisibility} = {treeVisibility: 'open' as const},
    concepts: tree,
    usage,
    usageMax = 0,
  } = useContext(TreeContext) || {}

  const isTop = kind === 'top'
  const level = concept.level ?? 0
  const hasChildren = (concept.childConcepts?.length ?? 0) > 0

  // The leading slots are the Tree View's, slot for slot. This view drags
  // nothing, but it renders beside that one in a sibling tab, so any slot it
  // declines to hold open shows up as every label jumping sideways when an
  // editor switches between them — which is what an earlier version of this
  // row did by reserving a caret on every childless row and no grip at all.
  const reservesCaret = kind === 'child' && !hasChildren
  // The published perspective is the one case where the Tree View offers no
  // editing, and so draws no grips anywhere.
  const reservesGrip = reservesGripSlot({
    isTopConcept: isTop,
    canEdit: releaseContext !== 'published',
    schemeHasRootOrphans: hasRootOrphans(tree ?? null),
  })

  // `undefined` means the counts have not landed. Rendering 0 for that would be
  // a lie in the one view whose whole purpose is that its zeros can be trusted,
  // so the lane stays blank until the query answers. A concept the loaded
  // result did not mention is genuinely untagged: the query asked about exactly
  // these ids.
  const count = usage ? (usage.get(concept.id) ?? 0) : undefined

  // The "orphan" badge only means anything in a scheme that has top concepts.
  const showsOrphanBadge = kind === 'orphan' && !!document.displayed?.topConcepts?.length

  const [levelVisibility, setLevelVisibility] = useState<'open' | 'closed'>(
    treeVisibility || 'open',
  )
  const handleToggle = useCallback(() => {
    setLevelVisibility((prev) => (prev === 'open' ? 'closed' : 'open'))
  }, [])

  return (
    <Box className={levelVisibility}>
      <Card radius={2}>
        <Flex align="center" justify="space-between" wrap="nowrap">
          {/* caret · label */}
          {/* (reserved caret) · grip · caret · label — the Tree View's order */}
          <Flex align="center" gap={0} flex={1} style={{minWidth: 0}}>
            {reservesCaret && <ToggleButton reserved />}
            {reservesGrip && <ConceptDragHandle visible={false} />}
            {hasChildren && <ToggleButton handler={handleToggle} visibility={levelVisibility} />}
            {/* minWidth lets this shrink below its content, so a long label
                ellipsizes instead of pushing the measure lane out of line. */}
            <Box flex={1} style={{minWidth: 0}}>
              <ConceptDetailLink concept={concept} topConcept={isTop} orphan={showsOrphanBadge} />
            </Box>
          </Flex>

          {/* count · bar — the measure lane, flush right at every depth */}
          <Flex align="center" gap={3} style={{flexShrink: 0}}>
            <Text
              size={2}
              textOverflow="ellipsis"
              style={{
                width: COUNT_WIDTH,
                flexShrink: 0,
                textAlign: 'right',
                // Tabular figures, so digits stack in a column rather than
                // shuffling sideways as the counts change width.
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {count ?? ''}
            </Text>
            <UsageBar count={count ?? 0} max={usageMax} />
          </Flex>
        </Flex>
      </Card>

      {hasChildren && level < MAX_VISIBLE_LEVEL && (
        <StatsChildConcepts concepts={concept.childConcepts!} childVisibility={levelVisibility} />
      )}
    </Box>
  )
}
