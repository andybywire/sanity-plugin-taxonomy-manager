/* eslint-disable react/require-default-props */
import {useCallback} from 'react'

import {truncateLabel} from '../../helpers'
import {useLinkColorScheme} from '../../hooks/useLinkColorScheme'
import type {ChildConceptTerm} from '../../types'

// import styles from './ConceptDetailLink.module.css'

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

  // add topConcept bolding here — see ConceptDetail Link

  return (
    <>
      {selectConcept ? (
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        <a
          // className={styles.conceptLink}
          href="#"
          onClick={handleClick}
          style={{color: linkColor}}
          title={prefLabel}
        >
          {truncatedLabel}
        </a>
      ) : (
        <p>{truncatedLabel}</p>
      )}
    </>
  )
}
