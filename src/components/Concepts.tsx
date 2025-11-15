import {AddCircleIcon, SquareIcon, ToggleArrowRightIcon, TrashIcon} from '@sanity/icons'
import {Text, Inline, Tooltip, Box, Button} from '@sanity/ui'
import {useCallback, useContext, useState} from 'react'

import {ReleaseContext, SchemeContext} from '../context'
import {useCreateConcept, useRemoveConcept} from '../hooks'
import type {ChildConceptTerm, ConceptSchemeDocument} from '../types'

import {ChildConcepts} from './ChildConcepts'
import styles from './Concepts.module.css'
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
    <Box className={[levelVisibility, styles.concept].join(' ')}>
      <Inline space={2}>
        <Inline space={0}>
          {concept?.childConcepts && concept.childConcepts.length > 0 && (
            <Button
              icon={ToggleArrowRightIcon}
              mode={'bleed'}
              aria-expanded={levelVisibility == 'open'}
              onClick={handleToggle}
            />
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
        {document.displayed?.topConcepts?.length && (
          <Text size={1} muted>
            orphan
          </Text>
        )}
        {inputComponent && <ConceptDetailDialogue concept={concept} />}
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
      </Inline>
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
