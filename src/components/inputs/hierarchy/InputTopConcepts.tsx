import {useCallback, useState} from 'react'
import {Text, Inline} from '@sanity/ui'
import {ToggleArrowRightIcon, SquareIcon} from '@sanity/icons'
import {TopConceptTerm} from '../../../types'
import {StyledTopConcept, StyledTreeToggle} from '../../../styles'
import {ChildConcepts} from '../../ChildConcepts'
import {ConceptSelectLink} from '../../ConceptSelectLink'
import {ConceptDetailDialogue} from '../../ConceptDetailDialogue'

type TopConceptsProps = {
  concept: TopConceptTerm
  treeVisibility: string
  inputComponent: Boolean
  selectConcept: any
}

/**
 * Top Concept Component
 * Renders a list of top concepts for a given schema.
 * TODO: consider modularizing add and remove buttons
 */
export const InputTopConcepts = ({
  concept,
  treeVisibility,
  inputComponent,
  selectConcept,
}: TopConceptsProps) => {
  const [levelVisibility, setLevelVisibility] = useState(treeVisibility)

  const handleToggle = useCallback(() => {
    if (levelVisibility == 'open') {
      setLevelVisibility('closed')
    } else if (levelVisibility == 'closed') {
      setLevelVisibility('open')
    }
  }, [levelVisibility])

  return (
    <StyledTopConcept className={levelVisibility}>
      <Inline space={2}>
        <Inline space={0}>
          {concept?.childConcepts &&
            concept.childConcepts.length > 0 &&
            (inputComponent ? (
              <SquareIcon className="spacer" />
            ) : (
              // will need this conditionally if the input is not limited to a single top concept
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
          {
            // may not be needed for input component
            !concept?.prefLabel && <span className="untitled">[new concept]</span>
          }
          <ConceptSelectLink concept={concept} selectConcept={selectConcept} />
        </Inline>
        <Text size={1} muted>
          top concept
        </Text>
        <ConceptDetailDialogue concept={concept} />
      </Inline>

      {concept?.childConcepts && concept.childConcepts.length > 0 && (
        <ChildConcepts
          concepts={concept.childConcepts}
          selectConcept={selectConcept}
          inputComponent={inputComponent}
        />
      )}
    </StyledTopConcept>
  )
}
