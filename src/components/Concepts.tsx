import {AddCircleIcon, SquareIcon, ToggleArrowRightIcon, TrashIcon} from '@sanity/icons'
import {Text, Inline, Tooltip, Box} from '@sanity/ui'
import {useCallback, useContext, useState} from 'react'

import {ReleaseContext, SchemeContext} from '../context'
import {useCreateConcept, useRemoveConcept} from '../hooks'
import {StyledConcept, StyledTreeButton, StyledTreeToggle} from '../styles'
import type {ChildConceptTerm, ConceptSchemeDocument} from '../types'

import {ChildConcepts} from './ChildConcepts'
import {ConceptDetailDialogue} from './interactions/ConceptDetailDialogue'
import {ConceptDetailLink} from './interactions/ConceptDetailLink'
import {ConceptSelectLink} from './interactions/ConceptSelectLink'

type ConceptProps = {
  concept: ChildConceptTerm
  treeVisibility: string
  inputComponent: boolean
  selectConcept: (conceptId: {
    _ref: string
    _type: 'reference'
    _originalId: string | undefined
  }) => void
}

/**
 * #### Concept Component
 * Renders a list of concepts for a given schema.
 */
export const Concepts = ({
  concept,
  treeVisibility,
  inputComponent,
  selectConcept,
}: ConceptProps) => {
  const document: ConceptSchemeDocument = useContext(SchemeContext) || ({} as ConceptSchemeDocument)
  const releaseContext: string = useContext(ReleaseContext) as string

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
    createConcept('concept', concept)
  }, [concept, createConcept])

  const handleRemoveConcept = useCallback(() => {
    removeConcept(concept.id, 'concept', concept?.prefLabel)
  }, [concept.id, concept?.prefLabel, removeConcept])

  return (
    <StyledConcept className={levelVisibility}>
      <Inline space={2}>
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
        {document.displayed?.topConcepts?.length && (
          <Text size={1} muted>
            orphan
          </Text>
        )}
        {inputComponent && <ConceptDetailDialogue concept={concept} />}
        {!inputComponent && releaseContext !== 'published' && (
          <Inline space={2}>
            <Tooltip
              delay={{open: 750}}
              content={
                <Box padding={1} sizing="content">
                  <Text muted size={1}>
                    Add a child concept below this concept
                  </Text>
                </Box>
              }
              fallbackPlacements={['right', 'left']}
              placement="top"
            >
              <StyledTreeButton
                onClick={handleAddChild}
                type="button"
                className="action"
                aria-label="Add a child concept below this concept"
              >
                <AddCircleIcon className="add" />
              </StyledTreeButton>
            </Tooltip>
            <Tooltip
              delay={{open: 750}}
              content={
                <Box padding={1} sizing="content">
                  <Text muted size={1}>
                    Remove this concept from this scheme
                  </Text>
                </Box>
              }
              fallbackPlacements={['right', 'left']}
              placement="top"
            >
              <StyledTreeButton
                onClick={handleRemoveConcept}
                type="button"
                className="action"
                aria-label="Remove this concept from this scheme"
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
    </StyledConcept>
  )
}
