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

const StyledOrphan = styled.li`
  padding-top: 0.5rem;
  font-weight: normal;
  margin-top: 0.75rem;
  .untitled {
    color: ${hues.gray[400].hex};
  }
`

export const Orphans = ({concept}: {concept: ChildConceptTerm}) => {
  const document: any = useContext(SchemeContext) || {}
  const createConcept = useCreateConcept(document)

  const handleAddChild = useCallback(() => {
    // TODO: Add in the data to create as child concept
    createConcept('concept')
  }, [createConcept])

  const handleRemoveConcept = useCallback(() => {
    // TODO: Add in the functionality to remove concept
    // eslint-disable-next-line no-alert
    alert('Remove concept — TBD')
  }, [])

  return (
    <StyledOrphan key={concept.id}>
      <Inline space={2}>
        {!concept?.prefLabel && <span className="untitled">[Untitled]</span>}
        <ConceptDetailLink concept={concept} />
        {document.displayed?.topConcepts?.length > 0 && (
          <Text size={1} muted>
            orphan
          </Text>
        )}
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
          <AddCircleIcon onClick={handleAddChild} />
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
          <TrashIcon onClick={handleRemoveConcept} />
        </Tooltip>
      </Inline>
      {concept?.childConcepts && concept.childConcepts.length > 0 && (
        <ChildConcepts concepts={concept.childConcepts} />
      )}
    </StyledOrphan>
  )
}
