import {Text, Inline, Tooltip, Box, Stack} from '@sanity/ui'
import {AddCircleIcon, TrashIcon} from '@sanity/icons'
import styled from 'styled-components'
import {ChildConcepts} from './ChildConcepts'
import {ConceptDetailLink} from './ConceptDetailLink'
import {TopConceptTerm} from '../types'
import {hues} from '@sanity/color'
import {useCallback, useContext} from 'react'
import {SchemeContext} from './TreeView'
import {useCreateConcept} from '../hooks/useCreateConcept'
import {useRemoveConcept} from '../hooks/useRemoveConcept'

const StyledTopConcept = styled.li`
  padding-top: 0.5rem;
  font-weight: bold;
  margin-top: 0.75rem;
  .untitled {
    color: ${hues.gray[400].hex};
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
        {!concept?.prefLabel && <span className="untitled">[Untitled]</span>}
        <ConceptDetailLink concept={concept} />
        <Text size={1} muted>
          top concept
        </Text>
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
    </StyledTopConcept>
  )
}
