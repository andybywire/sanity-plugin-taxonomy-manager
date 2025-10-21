/* eslint-disable react/require-default-props */
import {useCallback} from 'react'

import {useLinkColorScheme} from '../../hooks/useLinkColorScheme'
import {StyledConceptLink, StyledConceptTitle} from '../../styles'
import type {ChildConceptTerm} from '../../types'

function truncateLabel(label: string, maxLength = 45): string {
  if (!label) return ''
  return label.length > maxLength ? `${label.slice(0, maxLength).trimEnd()}…` : label
}

/**
 * #### Concept Select Link
 * Writes a concept _ref from the hierarchy tree to the current document
 */
export function ConceptSelectLink({
  concept,
  selectConcept,
}: {
  concept: ChildConceptTerm
  selectConcept?: (conceptRef: {
    _ref: string
    _type: 'reference'
    _originalId: string | undefined
  }) => void
}) {
  const {prefLabel, id, _originalId} = concept ?? {}

  const linkColor = useLinkColorScheme()

  const handleClick = useCallback(() => {
    if (!selectConcept) return

    const conceptRef = {
      _ref: id,
      _type: 'reference' as const,
      _originalId,
    }
    selectConcept(conceptRef)
  }, [id, _originalId, selectConcept])

  const truncatedLabel = truncateLabel(prefLabel)

  return (
    <>
      {selectConcept ? (
        <StyledConceptLink
          href="#"
          onClick={handleClick}
          style={{color: linkColor}}
          title={prefLabel}
        >
          {truncatedLabel}
        </StyledConceptLink>
      ) : (
        <StyledConceptTitle>{truncatedLabel}</StyledConceptTitle>
      )}
    </>
  )
}
