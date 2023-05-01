import {Text, Inline} from '@sanity/ui'
import styled from 'styled-components'
import {ChildConcepts} from './ChildConcepts'
import {TopConceptTerm} from '../types'

const StyledTopConcept = styled.li`
  padding-top: 0.5rem;
  font-weight: bold;
  margin-top: 0.75rem;
`
export const TopConcepts = ({concept}: {concept: TopConceptTerm}) => {
  return (
    <StyledTopConcept>
      <Inline space={2}>
        {concept?.prefLabel}
        <Text size={1} muted>
          top concept
        </Text>
      </Inline>
      {concept?.childConcepts && concept.childConcepts.length > 0 && (
        <ChildConcepts concepts={concept.childConcepts} />
      )}
    </StyledTopConcept>
  )
}
