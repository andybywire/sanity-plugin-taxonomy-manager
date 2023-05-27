/**
 * Child Concepts
 * This component renders a list of child concepts for a given concept.
 */

import {ChildConceptTerm} from '../types'
import {Children} from './Children'
import styled from 'styled-components'

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
