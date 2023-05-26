/**
 * Orphan Concept Component
 * @todo: add border and color on hover add child & remove icons
 *  - red, knocked out, border radius for remove; green for add
 */

import styled from 'styled-components'
import {Text, Inline, Tooltip, Box, Stack} from '@sanity/ui'
import {ChildConcepts} from './ChildConcepts'
import {ConceptDetailLink} from './ConceptDetailLink'
import {ChildConceptTerm} from '../types'
import {hues} from '@sanity/color'
import {AddCircleIcon, TrashIcon} from '@sanity/icons'
import {useCallback, useContext} from 'react'
import {SchemeContext} from './TreeView'
import {useCreateConcept} from '../hooks/useCreateConcept'
import {useRemoveConcept} from '../hooks/useRemoveConcept'

const StyledOrphan = styled.li`
  padding-top: 0.5rem;
  font-weight: normal;
  margin-top: 1.2rem;
  .untitled {
    color: ${hues.gray[400].hex};
  }
`

export const Orphans = ({concept}: {concept: ChildConceptTerm}) => {
  const document: any = useContext(SchemeContext) || {}
  const createConcept = useCreateConcept(document)
  const removeConcept = useRemoveConcept(document)

  const handleAddChild = useCallback(() => {
    createConcept('concept', concept?.id, concept?.prefLabel)
  }, [concept?.id, concept?.prefLabel, createConcept])

  const handleRemoveConcept = useCallback(() => {
    removeConcept(concept.id, 'concept', concept?.prefLabel)
  }, [concept.id, concept?.prefLabel, removeConcept])

  return (
    <StyledOrphan key={concept.id}>
      <Inline space={2}>
        {!concept?.prefLabel && <span className="untitled">[new concept]</span>}
        <ConceptDetailLink concept={concept} />
        {document.displayed?.topConcepts?.length > 0 && (
          <Text size={1} muted>
            orphan
          </Text>
        )}
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
              {/* Pass props to identify this element to an event handler */}
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
    </StyledOrphan>
  )
}
