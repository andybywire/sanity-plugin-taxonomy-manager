import {StyledChildConcepts} from '../styles'
import type {ChildConceptTerm} from '../types'

import {Children} from './Children'

/**
 * #### Child Concepts
 * Lenders a list of child concepts for a given concept
 * with a `<ul>` wrapper for each level of nesting
 */
export const ChildConcepts = ({
  concepts,
  inputComponent = false,
  selectConcept,
}: {
  concepts: ChildConceptTerm[]
  selectConcept: (conceptId: {_ref: string; _type: 'reference'}) => void
  inputComponent: boolean
}) => {
  return (
    <StyledChildConcepts>
      {concepts.map((concept: ChildConceptTerm) => {
        return (
          <Children
            key={concept.id}
            concept={concept}
            selectConcept={selectConcept}
            inputComponent={inputComponent}
          />
        )
      })}
    </StyledChildConcepts>
  )
}
