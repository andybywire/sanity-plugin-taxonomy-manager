/**
 * Child Concept Component
 * Renders a list of child concepts for a given concept.
 * @todo Add dialogue explaining max depth
 * @todo Handle childConcept and level definition checks more elegantly
 */

import {useCallback, useContext} from 'react'
import {Inline, Tooltip, Box, Stack, Text} from '@sanity/ui'
import {ErrorOutlineIcon, InfoOutlineIcon, AddCircleIcon, TrashIcon} from '@sanity/icons'
import {useCreateConcept, useRemoveConcept} from '../hooks'
import {ChildConceptTerm} from '../types'
import {SchemeContext} from './TreeView'
import {ChildConcepts} from './ChildConcepts'
import {ConceptDetailLink} from './ConceptDetailLink'
import styled from 'styled-components'

const StyledChildConcept = styled.li`
  font-weight: normal;
  margin-top: 1.5rem;
  div {
    // padding-top: 0;
  }
`

export const Children = ({concept}: {concept: ChildConceptTerm}) => {
  const document: any = useContext(SchemeContext) || {}
  const createConcept = useCreateConcept(document)
  const removeConcept = useRemoveConcept(document)

  const handleAddChild = useCallback(() => {
    if (document.displayed?._id === concept?.id) {
      // eslint-disable-next-line no-console
      console.log('Concept and document ids are the same.')
      return
    }
    createConcept('concept', concept?.id, concept?.prefLabel)
  }, [concept?.id, concept?.prefLabel, createConcept, document.displayed?._id])

  const handleRemoveConcept = useCallback(() => {
    removeConcept(concept.id, 'concept', concept?.prefLabel)
  }, [concept.id, concept?.prefLabel, removeConcept])

  return (
    <StyledChildConcept>
      <Inline space={2}>
        <Text size={2}>
          {!concept?.prefLabel && <span className="untitled">[new concept]</span>}
          <ConceptDetailLink concept={concept} />
        </Text>
        {document.displayed?.controls && concept?.level && concept.level < 5 && (
          <Inline space={1}>
            <AddCircleIcon className="normal" onClick={handleAddChild} />
            <TrashIcon className="critical" onClick={handleRemoveConcept} />
          </Inline>
        )}

        {document.displayed?.controls &&
          concept.childConcepts?.length == 0 &&
          concept.level == 5 && (
            <Inline space={1}>
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
                <InfoOutlineIcon className="warning" />
              </Tooltip>
              <TrashIcon className="critical" onClick={handleRemoveConcept} />
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
              <ErrorOutlineIcon className="error" />
            </Tooltip>
            {document.displayed?.controls && (
              <TrashIcon className="critical" onClick={handleRemoveConcept} />
            )}
          </Inline>
        )}
      </Inline>
      {concept?.childConcepts &&
        concept.childConcepts.length > 0 &&
        concept?.level &&
        concept.level < 5 && <ChildConcepts concepts={concept.childConcepts} />}
    </StyledChildConcept>
  )
}
