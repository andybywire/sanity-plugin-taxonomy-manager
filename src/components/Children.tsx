import {
  ErrorOutlineIcon,
  InfoOutlineIcon,
  AddCircleIcon,
  TrashIcon,
  ToggleArrowRightIcon,
  SquareIcon,
} from '@sanity/icons'
import {Inline, Tooltip, Box, Text} from '@sanity/ui'
import {useCallback, useContext, useState} from 'react'

import {ReleaseContext, SchemeContext, TreeContext} from '../context'
import {useCreateConcept, useRemoveConcept} from '../hooks'
import {StyledChildConcept, StyledTreeButton, StyledTreeToggle} from '../styles'
import type {ChildConceptTerm, ConceptSchemeDocument} from '../types'

import {ChildConcepts} from './ChildConcepts'
import {ConceptDetailDialogue} from './interactions/ConceptDetailDialogue'
import {ConceptDetailLink} from './interactions/ConceptDetailLink'
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
  selectConcept: (conceptId: {
    _ref: string
    _type: 'reference'
    _originalId: string | undefined
  }) => void
  inputComponent: boolean
}) => {
  const document: ConceptSchemeDocument = useContext(SchemeContext) || ({} as ConceptSchemeDocument)
  const releaseContext: string = useContext(ReleaseContext) as string
  const {
    // @ts-expect-error — sort out type
    globalVisibility: {treeVisibility},
  } = useContext(TreeContext) || {}
  const createConcept = useCreateConcept(document)
  const removeConcept = useRemoveConcept(document)

  const handleAddChild = useCallback(() => {
    createConcept('concept', concept)
  }, [concept, createConcept])

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
          {inputComponent && <ConceptDetailDialogue concept={concept} />}
        </Inline>
        {!inputComponent &&
          releaseContext !== 'published' &&
          concept?.level &&
          concept.level < 5 && (
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

        {!inputComponent &&
          releaseContext !== 'published' &&
          concept.childConcepts?.length == 0 &&
          concept.level == 5 && (
            <Inline space={2}>
              <Tooltip
                delay={{open: 750}}
                content={
                  <Box padding={1} sizing="content">
                    <Text muted size={1}>
                      This concept is at the maximum Taxonomy Manager hierarchy depth of 5 levels.
                    </Text>
                  </Box>
                }
                fallbackPlacements={['right', 'left']}
                placement="top"
              >
                <InfoOutlineIcon className="info warning" />
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
                  aria-label="Remove concept from scheme"
                >
                  <TrashIcon className="remove" />
                </StyledTreeButton>
              </Tooltip>
            </Inline>
          )}

        {concept?.childConcepts && concept?.childConcepts?.length > 0 && concept.level == 5 && (
          <Inline space={1}>
            <Tooltip
              delay={{open: 750}}
              content={
                <Box padding={1} sizing="content">
                  <Text muted size={1}>
                    This concept has unlisted child concepts. The maximum validated hierarchy depth
                    is 5 levels.
                  </Text>
                </Box>
              }
              fallbackPlacements={['right', 'left']}
              placement="top"
            >
              <ErrorOutlineIcon className="info error" />
            </Tooltip>
            {!inputComponent && releaseContext !== 'published' && (
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
                  aria-label="Remove concept from scheme"
                >
                  <TrashIcon className="remove" />
                </StyledTreeButton>
              </Tooltip>
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
