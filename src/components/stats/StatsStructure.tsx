import {Box, Stack} from '@sanity/ui'
import {useContext} from 'react'

import {TreeContext} from '../../context'
import {rootOrphans} from '../../core/tree/rootOrphans'
import type {ChildConceptTerm, DocumentConcepts, TopConceptTerm} from '../../types'
import {NoConcepts} from '../guides'

import {StatsRow} from './StatsRow'

/**
 * #### Stats Structure
 * The governance view's rows, in the scheme's own order: top concepts first,
 * then the orphans that sit at the root.
 *
 * The same two lists `TreeStructure` renders, from the same `rootOrphans`, so
 * the two views cannot disagree about what is in the scheme or where it sits.
 * Only the row differs.
 */
export const StatsStructure = ({concepts}: {concepts: DocumentConcepts | null}) => {
  // Rows read their own visibility from context; the id is needed here only to
  // remount every root row — and so the whole tree — on expand or collapse.
  const {globalVisibility: {treeId} = {treeId: 'default'}} = useContext(TreeContext) || {}

  if (!concepts?.topConcepts?.length && !concepts?.concepts?.length) {
    return <NoConcepts />
  }

  return (
    <Box paddingTop={4}>
      <Stack gap={3} style={{listStyle: 'none', paddingLeft: '0', marginBlockStart: '0'}}>
        {concepts?.topConcepts?.map((concept: TopConceptTerm) => (
          <StatsRow key={`${concept?.id}+${treeId}`} concept={concept} kind="top" />
        ))}
        {rootOrphans(concepts).map((concept: ChildConceptTerm) => (
          <StatsRow key={`${concept.id}+${treeId}`} concept={concept} kind="orphan" />
        ))}
      </Stack>
    </Box>
  )
}
