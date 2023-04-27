import styled from 'styled-components'
import {ChildConceptTerms} from '../types'

const StyledChildConcept = styled.ul`
  list-style: none;
  li {
    font-weight: normal;
    margin-top: 0.75rem;
  }
`

export const ChildConcepts = ({concepts}: {concepts: ChildConceptTerms[]}) => {
  return (
    <StyledChildConcept>
      {concepts.map((concept: any) => {
        return (
          <li key={concept.id}>
            {concept.prefLabel}
            {concept.childConcepts?.length > 0 && (
              <ChildConcepts concepts={concept.childConcepts} />
            )}
          </li>
        )
      })}
    </StyledChildConcept>
  )
}
