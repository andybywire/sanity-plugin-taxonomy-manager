import {Orphans} from './Orphans'
import {TopConcepts} from './TopConcepts'
import styled from 'styled-components'
import {TopConceptTerm, ChildConceptTerm, DocumentConcepts} from '../types'

const StyledTree = styled.ul`
  list-style: none;
  padding-left: 0;
  margin-top: 1rem;
`

export const TreeStructure = ({concepts}: {concepts: DocumentConcepts}) => {
  if (concepts.topConcepts === null && concepts.orphans.length === 0)
    return (
      <StyledTree>
        <li>There are no concepts assigned to this scheme.</li>
      </StyledTree>
    )

  return (
    <StyledTree>
      {concepts.topConcepts &&
        concepts.topConcepts.map((concept: TopConceptTerm) => {
          return <TopConcepts key={concept?.id} concept={concept} />
        })}
      {concepts.orphans.map((concept: ChildConceptTerm) => {
        return <Orphans key={concept.id} concept={concept} docConcepts={concepts} />
      })}
    </StyledTree>
  )
}
