/**
 * Child Concepts
 * This component renders a list of child concepts for a given concept.
 */

import styled from 'styled-components'
import {Children} from './Children'
import {ChildConceptTerm} from '../types'

const StyledChildConcepts = styled.ul`
  list-style: none;
`

export const ChildConcepts = ({concepts}: {concepts: ChildConceptTerm[]}) => {
  return (
    <StyledChildConcepts>
      {concepts.map((concept: any) => (
        <Children key={concept.id} concept={concept} />
      ))}
    </StyledChildConcepts>
  )
}
