import styled from 'styled-components'
import {Text, Inline} from '@sanity/ui'
import {ChildConcepts} from './ChildConcepts'
import {ChildConceptTerm, DocumentConcepts} from '../types'

const StyledOrphan = styled.li`
  padding-top: 0.5rem;
  font-weight: normal;
  margin-top: 0.75rem;
`

export const Orphans = ({
  concept,
  docConcepts,
}: {
  concept: ChildConceptTerm
  docConcepts: DocumentConcepts
}) => {
  return (
    <StyledOrphan key={concept.id}>
      <Inline space={2}>
        {concept?.prefLabel}
        {docConcepts.topConcepts?.length > 0 && (
          <Text size={1} muted>
            orphan
          </Text>
        )}
      </Inline>
      {concept?.childConcepts && concept.childConcepts.length > 0 && (
        <ChildConcepts concepts={concept.childConcepts} />
      )}
    </StyledOrphan>
  )
}
