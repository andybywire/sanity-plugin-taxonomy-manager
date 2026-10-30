import {Box, Stack} from '@sanity/ui'

import type {ChildConceptTerm} from '../types'

import {Children} from './Children'

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
  return (
    // the container for child terms
    <Box marginLeft={4} marginTop={2} display={childVisibility == 'closed' ? 'none' : 'block'}>
      <Stack gap={3}>
        {concepts.map((concept: ChildConceptTerm) => {
          return (
            <Children
              key={concept.id}
              concept={concept}
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
