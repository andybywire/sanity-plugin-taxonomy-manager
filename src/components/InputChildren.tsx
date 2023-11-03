/**
 * Child Concept Component
 * Renders a list of child concepts for a given concept.
 * @todo consider modularizing add and remove buttons
 * @todo Add dialogue explaining max depth
 * @todo Improve accessibility of hidden children and max depth disclosures
 * @todo Handle childConcept and level definition checks more elegantly
 */

import {useCallback, useContext, useState} from 'react'
import {Inline, Tooltip, Box, Stack, Text} from '@sanity/ui'
import {ErrorOutlineIcon, ToggleArrowRightIcon, SquareIcon} from '@sanity/icons'
import {ChildConceptTerm} from '../types'
import {StyledChildConcept, StyledTreeToggle} from '../styles'
import {TreeContext} from '../context'
import {ChildConcepts} from './ChildConcepts'
import {ConceptSelectLink} from './ConceptSelectLink'
import {ConceptDetailDialogue} from './ConceptDetailDialogue'

export const InputChildren = ({
  concept,
  selectConcept,
  inputComponent = false,
}: {
  concept: ChildConceptTerm
  selectConcept: any
  inputComponent: Boolean
}) => {
  //@ts-expect-error — This is part of the same complaint as in Hierarchy.tsx
  const {treeVisibility} = useContext(TreeContext) || {}

  const [levelVisibility, setLevelVisibility] = useState(treeVisibility)

  const handleToggle = useCallback(() => {
    if (levelVisibility == 'open') {
      setLevelVisibility('closed')
    } else if (levelVisibility == 'closed') {
      setLevelVisibility('open')
    }
  }, [levelVisibility])

  return (
    <StyledChildConcept className={levelVisibility}>
      <Inline space={2}>
        <Inline space={1}>
          <Inline space={1}>
            {concept?.childConcepts && concept.childConcepts.length > 0 && (
              <StyledTreeToggle
                onClick={handleToggle}
                type="button"
                aria-expanded={levelVisibility == 'open'}
              >
                <ToggleArrowRightIcon />
              </StyledTreeToggle>
            )}
            {concept?.childConcepts && concept.childConcepts.length == 0 && (
              <SquareIcon className="spacer" />
            )}
            {!concept?.prefLabel && <span className="untitled">[new concept]</span>}
            <ConceptSelectLink concept={concept} selectConcept={selectConcept} />
          </Inline>
          <ConceptDetailDialogue concept={concept} />
        </Inline>

        {concept?.childConcepts && concept?.childConcepts?.length > 0 && concept.level == 5 && (
          <Inline space={1}>
            <Tooltip
              content={
                <Box padding={2} sizing="border">
                  <Stack padding={1} space={2}>
                    <Text muted size={1}>
                      This concept has unlisted child concepts.
                    </Text>
                    <Text muted size={1}>
                      The maximum hierarchy depth is 5 levels.
                    </Text>
                  </Stack>
                </Box>
              }
              fallbackPlacements={['right', 'left']}
              placement="top"
            >
              <ErrorOutlineIcon className="info error" />
            </Tooltip>
          </Inline>
        )}
      </Inline>
      {concept?.childConcepts &&
        concept.childConcepts.length > 0 &&
        concept?.level &&
        concept.level < 5 && (
          <ChildConcepts
            concepts={concept.childConcepts}
            selectConcept={selectConcept}
            inputComponent={inputComponent}
          />
        )}
    </StyledChildConcept>
  )
}