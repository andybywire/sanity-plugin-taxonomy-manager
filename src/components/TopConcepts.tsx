import {useCallback, useContext, useState} from 'react'
import {Text, Inline, Tooltip, Box, Stack} from '@sanity/ui'
import {AddCircleIcon, TrashIcon, ToggleArrowRightIcon, SquareIcon} from '@sanity/icons'
import {useCreateConcept, useRemoveConcept} from '../hooks'
import {TopConceptTerm} from '../types'
import {StyledTopConcept, StyledTreeToggle, StyledTreeButton} from '../styles'
import {SchemeContext, TreeContext} from '../context'
import {ChildConcepts} from './ChildConcepts'
import {ConceptDetailLink} from './interactions/ConceptDetailLink'
import {ConceptDetailDialogue} from './interactions/ConceptDetailDialogue'
import {ConceptSelectLink} from './interactions/ConceptSelectLink'

type TopConceptsProps = {
  concept: TopConceptTerm
  treeVisibility: string
  inputComponent: Boolean
  selectConcept: any
}

/**
 * #### Top Concept Component
 * Renders a list of top concepts for a given schema.
 */
export const TopConcepts = ({
  concept,
  treeVisibility,
  inputComponent,
  selectConcept,
}: TopConceptsProps) => {
  const document: any = useContext(SchemeContext) || {}
  const {editControls} = useContext(TreeContext) || {editControls: false}

  const createConcept = useCreateConcept(document)
  const removeConcept = useRemoveConcept(document)

  const [levelVisibility, setLevelVisibility] = useState(treeVisibility)

  const handleToggle = useCallback(() => {
    if (levelVisibility == 'open') {
      setLevelVisibility('closed')
    } else if (levelVisibility == 'closed') {
      setLevelVisibility('open')
    }
  }, [levelVisibility])

  const handleAddChild = useCallback(() => {
    createConcept('concept', concept?.id, concept?.prefLabel)
  }, [concept?.id, concept?.prefLabel, createConcept])

  const handleRemoveConcept = useCallback(() => {
    removeConcept(concept?.id, 'topConcept', concept?.prefLabel)
  }, [concept?.id, concept?.prefLabel, removeConcept])

  return (
    <StyledTopConcept className={levelVisibility}>
      <Inline space={2}>
        <Inline space={0}>
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
        <Text size={1} muted>
          top concept
        </Text>
        {!editControls && <ConceptDetailDialogue concept={concept} />}
        {editControls && (
          <Inline space={2}>
            <Tooltip
              content={
                <Box padding={2} sizing="border">
                  <Stack padding={1} space={2}>
                    <Text muted size={1}>
                      Add a child concept
                    </Text>
                  </Stack>
                </Box>
              }
              fallbackPlacements={['right', 'left']}
              placement="top"
            >
              <StyledTreeButton
                onClick={handleAddChild}
                type="button"
                className="action"
                aria-label="Add child a child concept"
              >
                <AddCircleIcon className="add" />
              </StyledTreeButton>
            </Tooltip>
            <Tooltip
              content={
                <Box padding={2} sizing="border">
                  <Stack padding={1} space={2}>
                    <Text muted size={1}>
                      Remove concept from scheme
                    </Text>
                  </Stack>
                </Box>
              }
              fallbackPlacements={['right', 'left']}
              placement="top"
            >
              <StyledTreeButton
                onClick={handleRemoveConcept}
                type="button"
                className="action"
                aria-label="Remove concept from scheme"
              >
                <TrashIcon className="remove" />
              </StyledTreeButton>
            </Tooltip>
          </Inline>
        )}
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
