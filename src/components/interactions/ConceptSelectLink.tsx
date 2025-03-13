/* eslint-disable react/require-default-props */
import {useCallback} from 'react'
import {ChildConceptTerm} from '../../types'
import {StyledConceptLink, StyledConceptTitle} from '../../styles'
import {useLinkColorScheme} from '../../hooks/useLinkColorScheme'

/**
 * #### Concept Select Link
 * Writes a concept _ref from the hierarchy tree to the current document
 */
export function ConceptSelectLink({
  concept,
  selectConcept,
}: {
  concept: ChildConceptTerm
  selectConcept?: any
}) {
  const {prefLabel, id} = concept ?? {}

  const linkColor = useLinkColorScheme()

  const handleClick = useCallback(() => {
    const conceptRef = {
      _ref: id,
      _type: 'reference',
    }
    selectConcept(conceptRef)
  }, [id, selectConcept])

  return (
    <>
      {selectConcept ? (
        <StyledConceptLink href="#" onClick={handleClick} style={{color: linkColor}}>
          {prefLabel}
        </StyledConceptLink>
      ) : (
        <StyledConceptTitle>{prefLabel}</StyledConceptTitle>
      )}
    </>
  )
}
