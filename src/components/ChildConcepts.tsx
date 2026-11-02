import {Box, Stack} from '@sanity/ui'

import {useControlWidth} from '../hooks'
import type {ChildConceptTerm} from '../types'

import {ConceptRow} from './ConceptRow'

/**
 * #### Child Concepts
 * Lenders a list of child concepts for a given concept
 * with a `<ul>` wrapper for each level of nesting
 */
export const ChildConcepts = ({
  concepts,
  parentId,
  inputComponent = false,
  selectConcept,
  childVisibility,
}: {
  concepts: ChildConceptTerm[]
  /** The concept these children hang under — the broader term of each one. */
  parentId: string
  selectConcept: (conceptId: {
    _ref: string
    _type: 'reference'
    _originalId: string | undefined
  }) => void
  inputComponent: boolean
  childVisibility: string // retype to 'open' | 'closed
}) => {
  // One control per level, which lands a child's caret under the first
  // letter of its parent's label.
  const indent = useControlWidth()

  return (
    // the container for child terms
    <Box
      marginTop={2}
      display={childVisibility == 'closed' ? 'none' : 'block'}
      style={{marginLeft: indent}}
    >
      <Stack gap={3}>
        {concepts.map((concept: ChildConceptTerm) => {
          return (
            <ConceptRow
              key={concept.id}
              concept={concept}
              kind="child"
              parentId={parentId}
              selectConcept={selectConcept}
              inputComponent={inputComponent}
            />
          )
        })}
      </Stack>
    </Box>
  )
}
