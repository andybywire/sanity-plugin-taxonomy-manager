/**
 * Orphan Concept Component
 * Renders a list of orphan concepts for a given schema.
 * TODO consider modularizing add and remove buttons
 */

import {useCallback, useContext, useState} from 'react'
import {Text, Inline} from '@sanity/ui'
import {SquareIcon, ToggleArrowRightIcon} from '@sanity/icons'
import {ChildConceptTerm} from '../../../types'
import {StyledOrphan, StyledTreeToggle} from '../../../styles'
import {SchemeContext} from '../../../context'
import {ChildConcepts} from '../../ChildConcepts'
import {ConceptDetailDialogue} from '../../ConceptDetailDialogue'
import {ConceptSelectLink} from '../../ConceptSelectLink'

type OrphanProps = {
  concept: ChildConceptTerm
  treeVisibility: string
  inputComponent: Boolean
  selectConcept: any
}

export const InputOrphans = ({
  concept,
  treeVisibility,
  inputComponent,
  selectConcept,
}: OrphanProps) => {
  const document: any = useContext(SchemeContext) || {}
  // const createConcept = useCreateConcept(document)
  // const removeConcept = useRemoveConcept(document)

  const [levelVisibility, setLevelVisibility] = useState(treeVisibility)

  const handleToggle = useCallback(() => {
    if (levelVisibility == 'open') {
      setLevelVisibility('closed')
    } else if (levelVisibility == 'closed') {
      setLevelVisibility('open')
    }
  }, [levelVisibility])

  // const handleAddChild = useCallback(() => {
  //   createConcept('concept', concept?.id, concept?.prefLabel)
  // }, [concept?.id, concept?.prefLabel, createConcept])

  // const handleRemoveConcept = useCallback(() => {
  //   removeConcept(concept.id, 'concept', concept?.prefLabel)
  // }, [concept.id, concept?.prefLabel, removeConcept])

  return (
    <StyledOrphan className={levelVisibility}>
      <Inline space={2}>
        {concept?.childConcepts &&
          concept.childConcepts.length > 0 &&
          (inputComponent ? (
            <SquareIcon className="spacer" />
          ) : (
            <StyledTreeToggle
              onClick={handleToggle}
              type="button"
              aria-expanded={levelVisibility == 'open'}
            >
              <ToggleArrowRightIcon />
            </StyledTreeToggle>
          ))}
        {concept?.childConcepts && concept.childConcepts.length == 0 && (
          <SquareIcon className="spacer" />
        )}
        {!concept?.prefLabel && <span className="untitled">[new concept]</span>}
        <ConceptSelectLink concept={concept} selectConcept={selectConcept} />

        {document.displayed?.topConcepts?.length > 0 && (
          <Text size={1} muted>
            orphan
          </Text>
        )}
        <ConceptDetailDialogue concept={concept} />
      </Inline>
      {concept?.childConcepts && concept.childConcepts.length > 0 && (
        <ChildConcepts
          concepts={concept.childConcepts}
          selectConcept={selectConcept}
          inputComponent={inputComponent}
        />
      )}
    </StyledOrphan>
  )
}
