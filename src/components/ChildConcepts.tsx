/**
 * Child Concepts
 * This component renders a list of child concepts for a given concept.
 * - provides the <ul> wrapper for each level of nesting
 */

import {ChildConceptTerm} from '../types'
import {StyledChildConcepts} from '../styles'
import {Children} from './Children'
import {InputChildren} from './InputChildren'

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
      {concepts.map((concept: any) => {
        if (inputComponent) {
          return (
            <InputChildren
              key={concept.id}
              concept={concept}
              selectConcept={selectConcept}
              inputComponent={inputComponent}
            />
          )
        }
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
