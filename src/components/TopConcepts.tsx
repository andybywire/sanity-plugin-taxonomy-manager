import {Flex, Inline, Box} from '@sanity/ui'
import {useCallback, useContext, useState} from 'react'

import {ReleaseContext, SchemeContext} from '../context'
import {useCreateConcept, useRemoveConcept} from '../hooks'
import type {ConceptSchemeDocument, TopConceptTerm} from '../types'

import {ChildConcepts} from './ChildConcepts'
import {ConceptDetailDialogue} from './interactions/ConceptDetailDialogue'
import {ConceptDetailLink} from './interactions/ConceptDetailLink'
import {ConceptEditAction} from './interactions/ConceptEditAction'
import {ConceptSelectLink} from './interactions/ConceptSelectLink'
import {ToggleButton} from './interactions/ToggleButton'

type TopConceptsProps = {
  concept: TopConceptTerm
  treeVisibility: string
  inputComponent: boolean
  selectConcept: (conceptId: {_ref: string; _type: 'reference'}) => void
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
  const document: ConceptSchemeDocument = useContext(SchemeContext) || ({} as ConceptSchemeDocument)
  const releaseContext: string = useContext(ReleaseContext) as string

  const createConcept = useCreateConcept(document)
  const removeConcept = useRemoveConcept(document)

  const [levelVisibility, setLevelVisibility] = useState(
    treeVisibility === 'closed' && concept.hasMatchingDescendant ? 'open' : treeVisibility
  )

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
    removeConcept(concept?.id, 'topConcept', concept?.prefLabel)
  }, [concept?.id, concept?.prefLabel, removeConcept])

  return (
    <Box className={levelVisibility}>
      <Flex align={'center'} justify={'space-between'} wrap={'nowrap'}>
        {/* Toggle, label, tag — left half of flexbox */}
        <Flex align="center" gap={0} flex={1} style={{minWidth: 0}}>
          {concept?.childConcepts && concept.childConcepts.length > 0 && (
            <ToggleButton handler={handleToggle} visibility={levelVisibility} />
          )}
          {!concept?.prefLabel && (
            <Box
              flex={1}
              marginLeft={!concept?.childConcepts || concept.childConcepts.length == 0 ? 5 : 0}
            >
              <ConceptDetailLink concept={concept} topConcept />
            </Box>
          )}
          {concept?.prefLabel && (
            <Box
              flex={1}
              marginLeft={!concept?.childConcepts || concept.childConcepts.length == 0 ? 5 : 0}
            >
              {inputComponent ? (
                <ConceptSelectLink concept={concept} selectConcept={selectConcept} topConcept />
              ) : (
                <ConceptDetailLink concept={concept} topConcept />
              )}
            </Box>
          )}
        </Flex>
        {/* Concept info and edit actions — right half of flexbox */}
        {inputComponent && <ConceptDetailDialogue concept={concept} />}
        {!inputComponent && releaseContext !== 'published' && (
          <Inline>
            <ConceptEditAction action={'add'} handler={handleAddChild} />
            <ConceptEditAction action={'remove'} handler={handleRemoveConcept} />
          </Inline>
        )}
      </Flex>
      {/* Child Concepts */}
      {concept?.childConcepts && concept.childConcepts.length > 0 && (
        <ChildConcepts
          concepts={concept.childConcepts}
          selectConcept={selectConcept}
          inputComponent={inputComponent}
          childVisibility={levelVisibility}
        />
      )}
    </Box>
  )
}
