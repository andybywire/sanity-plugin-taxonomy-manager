import styled from 'styled-components'
import {Text, Inline} from '@sanity/ui'
import {ChildConcepts} from './ChildConcepts'
import {ConceptDetailLink} from './ConceptDetailLink'
import {ChildConceptTerm, DocumentConcepts} from '../types'
import {hues} from '@sanity/color'

const StyledOrphan = styled.li`
  padding-top: 0.5rem;
  font-weight: normal;
  margin-top: 0.75rem;
  .untitled {
    color: ${hues.gray[400].hex};
  }
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
        {!concept?.prefLabel && <span className="untitled">[Untitled]</span>}
        <ConceptDetailLink concept={concept} />
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
