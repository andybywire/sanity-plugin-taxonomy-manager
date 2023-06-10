/**
 * Top Concept Component
 * Renders a list of top concepts for a given schema.
 */

import {useCallback, useContext, useState} from 'react'
import {Text, Inline, Tooltip, Box, Stack} from '@sanity/ui'
import {AddCircleIcon, TrashIcon, ToggleArrowRightIcon, SquareIcon} from '@sanity/icons'
import {useCreateConcept, useRemoveConcept} from '../hooks'
import {StyledTopConcept} from '../styles'
import {TopConceptTerm} from '../types'
import {ChildConcepts} from './ChildConcepts'
import {SchemeContext} from './TreeView'
import {ConceptDetailLink} from './ConceptDetailLink'
import {ConceptDetailDialogue} from './ConceptDetailDialogue'

type TopConceptsProps = {
  concept: TopConceptTerm
  treeVisibility: string
}

export const TopConcepts = ({concept, treeVisibility}: TopConceptsProps) => {
  const document: any = useContext(SchemeContext) || {}
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
            <button onClick={handleToggle} type="button" aria-expanded={levelVisibility == 'open'}>
              <ToggleArrowRightIcon />
            </button>
          )}
          {concept?.childConcepts && concept.childConcepts.length == 0 && (
            <SquareIcon className="spacer" />
          )}
          {!concept?.prefLabel && <span className="untitled">[new concept]</span>}
          {/* <ToggleArrowRightIcon onClick={handleToggle} /> */}
          <ConceptDetailLink concept={concept} />
          {/* <Text size={1}>{levelVisibility}</Text> */}
        </Inline>
        <Text size={1} muted>
          top concept
        </Text>
        {!document.displayed?.controls && <ConceptDetailDialogue concept={concept} />}
        {document.displayed?.controls && (
          <>
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
              <AddCircleIcon className="normal" onClick={handleAddChild} />
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
              <TrashIcon className="critical" onClick={handleRemoveConcept} />
            </Tooltip>
          </>
        )}
      </Inline>
      {concept?.childConcepts && concept.childConcepts.length > 0 && (
        <ChildConcepts concepts={concept.childConcepts} />
      )}
    </StyledTopConcept>
  )
}
