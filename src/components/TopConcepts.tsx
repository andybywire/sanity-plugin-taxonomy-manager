import {Text, Inline} from '@sanity/ui'
import styled from 'styled-components'
import {TopConceptTerms} from '../types'
import {ChildConcepts} from './ChildConcepts'

const StyledTopConcept = styled.li`
  padding-top: 0.5rem;
  font-weight: bold;
  margin-top: 0.75rem;
`
export const TopConcepts = ({concept}: {concept: TopConceptTerms[]}) => {
  return (
    <StyledTopConcept key={concept?.id}>
      <Inline space={2} onResize={undefined} onResizeCapture={undefined}>
        {concept?.prefLabel}
        <Text size={1} muted onResize={undefined} onResizeCapture={undefined}>
          top concept
        </Text>
      </Inline>
      {concept?.childConcepts && concept.childConcepts.length > 0 && (
        <ChildConcepts concepts={concept.childConcepts} />
      )}
    </StyledTopConcept>
  )
}
