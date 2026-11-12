import {Box, Stack} from '@sanity/ui'

import {useControlWidth} from '../../hooks'
import type {ChildConceptTerm} from '../../types'

import {StatsRow} from './StatsRow'

/**
 * #### Stats Child Concepts
 * One level of nesting in the governance view.
 *
 * Indents by exactly one control, from `useControlWidth` — the same measured
 * 25px the Tree View steps by, so a concept sits at the same depth in both
 * views and the hierarchy reads as one thing seen twice.
 *
 * The indent is a margin on the wrapper rather than padding on each row, which
 * is what keeps the measure lane aligned: a block box with a left margin
 * still ends at its container's right edge, so the count and bar stay flush
 * right at every depth while only the label's room shrinks.
 */
export const StatsChildConcepts = ({
  concepts,
  childVisibility,
}: {
  concepts: ChildConceptTerm[]
  childVisibility: 'open' | 'closed'
}) => {
  const indent = useControlWidth()

  return (
    <Box
      marginTop={2}
      display={childVisibility === 'closed' ? 'none' : 'block'}
      style={{marginLeft: indent}}
    >
      <Stack gap={3}>
        {concepts.map((concept: ChildConceptTerm) => (
          <StatsRow key={concept.id} concept={concept} kind="child" />
        ))}
      </Stack>
    </Box>
  )
}
