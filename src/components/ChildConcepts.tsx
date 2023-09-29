/**
 * Child Concepts
 * This component renders a list of child concepts for a given concept.
 * - provides the <ul> wrapper for each level of nesting
 */

import {ChildConceptTerm} from '../types'
import {StyledChildConcepts} from '../styles'
import {Children} from './Children'

export const ChildConcepts = ({
  concepts,
  inputComponent = false,
  selectConcept,
}: {
  concepts: ChildConceptTerm[]
  selectConcept: any
  inputComponent: Boolean
}) => {
  return (
    <StyledChildConcepts>
      {concepts.map((concept: any) => (
        <Children
          key={concept.id}
          concept={concept}
          selectConcept={selectConcept}
          inputComponent={inputComponent}
        />
      ))}
    </StyledChildConcepts>
  )
}
