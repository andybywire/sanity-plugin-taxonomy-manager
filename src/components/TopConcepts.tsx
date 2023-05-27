/**
 * Top Concept Component
 * Renders a list of top concepts for a given schema.
 */

import {useCallback, useContext} from 'react'
import {Text, Inline, Tooltip, Box, Stack} from '@sanity/ui'
import {AddCircleIcon, TrashIcon} from '@sanity/icons'
import {hues} from '@sanity/color'
import {useCreateConcept, useRemoveConcept} from '../hooks'
import {TopConceptTerm} from '../types'
import {ChildConcepts} from './ChildConcepts'
import {SchemeContext} from './TreeView'
import {ConceptDetailLink} from './ConceptDetailLink'
import styled from 'styled-components'

const StyledTopConcept = styled.li`
  padding-top: 0.5rem;
  font-weight: bold;
  margin-top: 1.2rem;
  .untitled {
    color: ${hues.gray[400].hex};
    font-weight: normal;
  }
`
export const TopConcepts = ({concept}: {concept: TopConceptTerm}) => {
  const document: any = useContext(SchemeContext) || {}
  const createConcept = useCreateConcept(document)
  const removeConcept = useRemoveConcept(document)

  const handleAddChild = useCallback(() => {
    createConcept('concept', concept?.id, concept?.prefLabel)
  }, [concept?.id, concept?.prefLabel, createConcept])

  const handleRemoveConcept = useCallback(() => {
    removeConcept(concept?.id, 'topConcept', concept?.prefLabel)
  }, [concept?.id, concept?.prefLabel, removeConcept])

  return (
    <StyledTopConcept>
      <Inline space={2}>
        {!concept?.prefLabel && <span className="untitled">[new concept]</span>}
        <ConceptDetailLink concept={concept} />
        <Text size={1} muted>
          top concept
        </Text>
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
