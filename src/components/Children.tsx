import {useCallback, useContext, useState} from 'react'
import {Inline, Tooltip, Box, Stack, Text} from '@sanity/ui'
import {
  ErrorOutlineIcon,
  InfoOutlineIcon,
  AddCircleIcon,
  TrashIcon,
  ToggleArrowRightIcon,
  SquareIcon,
} from '@sanity/icons'
import {useCreateConcept, useRemoveConcept} from '../hooks'
import {ChildConceptTerm} from '../types'
import {StyledChildConcept, StyledTreeButton, StyledTreeToggle} from '../styles'
import {SchemeContext, TreeContext} from '../context'
import {ChildConcepts} from './ChildConcepts'
import {ConceptDetailLink} from './interactions/ConceptDetailLink'
import {ConceptDetailDialogue} from './interactions/ConceptDetailDialogue'
import {ConceptSelectLink} from './interactions/ConceptSelectLink'

/**
 * #### Child Concept Component
 * Renders a list of child concepts for a given concept.
 */
export const Children = ({
  concept,
  selectConcept,
  inputComponent = false,
}: {
  concept: ChildConceptTerm
  selectConcept: any
  inputComponent: Boolean
}) => {
  const document: any = useContext(SchemeContext) || {}
  const {
    // @ts-expect-error — sort out type
    globalVisibility: {treeVisibility},
  } = useContext(TreeContext) || {}
  const {editControls} = useContext(TreeContext) || {editControls: false}
  const createConcept = useCreateConcept(document)
  const removeConcept = useRemoveConcept(document)

  const handleAddChild = useCallback(() => {
    createConcept('concept', concept?.id, concept?.prefLabel)
  }, [concept?.id, concept?.prefLabel, createConcept])

  const handleRemoveConcept = useCallback(() => {
    removeConcept(concept.id, 'concept', concept?.prefLabel)
  }, [concept.id, concept?.prefLabel, removeConcept])

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
            {inputComponent ? (
              <ConceptSelectLink concept={concept} selectConcept={selectConcept} />
            ) : (
              <ConceptDetailLink concept={concept} />
            )}
          </Inline>
          {!editControls && <ConceptDetailDialogue concept={concept} />}
        </Inline>
        {editControls && concept?.level && concept.level < 5 && (
          <Inline space={2}>
            <StyledTreeButton
              onClick={handleAddChild}
              type="button"
              className="action"
              aria-label="Add child a child concept"
            >
              <AddCircleIcon className="add" />
            </StyledTreeButton>
            <StyledTreeButton
              onClick={handleRemoveConcept}
              type="button"
              className="action"
              aria-label="Remove concept from scheme"
            >
              <TrashIcon className="remove" />
            </StyledTreeButton>
          </Inline>
        )}

        {editControls && concept.childConcepts?.length == 0 && concept.level == 5 && (
          <Inline space={2}>
            <Tooltip
              content={
                <Box padding={2} sizing="border">
                  <Stack padding={1} space={2}>
                    <Text muted size={1}>
                      This concept is at the maximum Taxonomy Manager hierarchy depth of 5 levels.
                    </Text>
                  </Stack>
                </Box>
              }
              fallbackPlacements={['right', 'left']}
              placement="top"
            >
              <InfoOutlineIcon className="info warning" />
            </Tooltip>
            <StyledTreeButton
              onClick={handleRemoveConcept}
              type="button"
              className="action"
              aria-label="Remove concept from scheme"
            >
              <TrashIcon className="remove" />
            </StyledTreeButton>
          </Inline>
        )}

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
            {document.displayed?.controls && (
              <StyledTreeButton
                onClick={handleRemoveConcept}
                type="button"
                className="action"
                aria-label="Remove concept from scheme"
              >
                <TrashIcon className="remove" />
              </StyledTreeButton>
            )}
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
