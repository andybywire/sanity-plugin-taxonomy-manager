import {AddCircleIcon, TrashIcon, ToggleArrowRightIcon} from '@sanity/icons'
import {Flex, Text, Inline, Tooltip, Box, Button} from '@sanity/ui'
import {useCallback, useContext, useState} from 'react'

import {ReleaseContext, SchemeContext} from '../context'
import {useCreateConcept, useRemoveConcept} from '../hooks'
import type {ConceptSchemeDocument, TopConceptTerm} from '../types'

import {ChildConcepts} from './ChildConcepts'
import {ConceptDetailDialogue} from './interactions/ConceptDetailDialogue'
import {ConceptDetailLink} from './interactions/ConceptDetailLink'
import {ConceptSelectLink} from './interactions/ConceptSelectLink'
import styles from './TopConcepts.module.css'

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
    removeConcept(concept?.id, 'topConcept', concept?.prefLabel)
  }, [concept?.id, concept?.prefLabel, removeConcept])

  return (
    <Box className={[levelVisibility, styles.topConcept].join(' ')}>
      <Flex align={'center'} justify={'space-between'}>
        {/* Toggle, label, tag */}
        <Inline space={0}>
          {concept?.childConcepts && concept.childConcepts.length > 0 && (
            <Button
              icon={ToggleArrowRightIcon}
              mode={'bleed'}
              aria-expanded={levelVisibility == 'open'}
              onClick={handleToggle}
            />
          )}
          {!concept?.prefLabel && (
            <Box marginLeft={!concept.childConcepts || concept.childConcepts.length == 0 ? 5 : 0}>
              <Text muted size={2}>
                [new concept]
              </Text>
            </Box>
          )}
          <Box marginLeft={!concept.childConcepts || concept.childConcepts.length == 0 ? 5 : 0}>
            {inputComponent ? (
              <ConceptSelectLink concept={concept} selectConcept={selectConcept} />
            ) : (
              <ConceptDetailLink concept={concept} topConcept />
            )}
          </Box>
          <Text size={1} muted>
            top concept
          </Text>
        </Inline>
        {/* Input component info buttons */}
        {/* TO DO: Will probably need Inline component */}
        {inputComponent && <ConceptDetailDialogue concept={concept} />}
        {/* Concept add and remove buttons and tooltips */}
        {!inputComponent && releaseContext !== 'published' && (
          <Inline>
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
              <Button
                icon={AddCircleIcon}
                mode={'bleed'}
                onClick={handleAddChild}
                tone={'positive'}
                aria-label="Add child a child concept"
              />
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
              <Button
                icon={TrashIcon}
                mode={'bleed'}
                onClick={handleRemoveConcept}
                tone={'critical'}
                aria-label="Remove this concept from this scheme"
              />
            </Tooltip>
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
