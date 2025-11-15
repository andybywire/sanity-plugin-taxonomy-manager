/* eslint-disable complexity */
import {Inline, Box, Flex} from '@sanity/ui'
import {useCallback, useContext, useState} from 'react'

import {ReleaseContext, SchemeContext, TreeContext} from '../context'
import {useCreateConcept, useRemoveConcept} from '../hooks'
import type {ChildConceptTerm, ConceptSchemeDocument} from '../types'

import {ChildConcepts} from './ChildConcepts'
import {ConceptDetailDialogue} from './interactions/ConceptDetailDialogue'
import {ConceptDetailLink} from './interactions/ConceptDetailLink'
import {ConceptEditAction} from './interactions/ConceptEditAction'
import {ConceptSelectLink} from './interactions/ConceptSelectLink'
import {StructureDetailDialogue} from './interactions/StructureDetailDialogue'
import {ToggleButton} from './interactions/ToggleButton'

/**
 * #### Child Concept Component
 * Renders a list of child concepts and applicable
 * actions for a given concept.
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
  const {globalVisibility: {treeVisibility} = {treeVisibility: 'open' as const}} =
    useContext(TreeContext) || {}
  const createConcept = useCreateConcept(document)
  const removeConcept = useRemoveConcept(document)

  const handleAddChild = useCallback(() => {
    createConcept('concept', concept)
  }, [concept, createConcept])

  const handleRemoveConcept = useCallback(() => {
    removeConcept(concept.id, 'concept', concept?.prefLabel)
  }, [concept.id, concept?.prefLabel, removeConcept])

  const [levelVisibility, setLevelVisibility] = useState<'open' | 'closed'>(
    treeVisibility || 'open'
  )

  const handleToggle = useCallback(() => {
    if (levelVisibility == 'open') {
      setLevelVisibility('closed')
    } else if (levelVisibility == 'closed') {
      setLevelVisibility('open')
    }
  }, [levelVisibility])

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
              marginLeft={!concept.childConcepts || concept.childConcepts.length == 0 ? 5 : 0}
            >
              <ConceptDetailLink concept={concept} />
            </Box>
          )}
          {concept?.prefLabel && (
            <Box
              flex={1}
              marginLeft={!concept.childConcepts || concept.childConcepts.length == 0 ? 5 : 0}
            >
              {inputComponent ? (
                <ConceptSelectLink concept={concept} selectConcept={selectConcept} />
              ) : (
                <ConceptDetailLink concept={concept} />
              )}
            </Box>
          )}
        </Flex>
        {/* Concept info and edit actions — right half of flexbox */}
        {inputComponent && <ConceptDetailDialogue concept={concept} />}
        {!inputComponent &&
          releaseContext !== 'published' &&
          concept?.level &&
          concept.level < 5 && (
            <Inline>
              <ConceptEditAction action={'add'} handler={handleAddChild} />
              <ConceptEditAction action={'remove'} handler={handleRemoveConcept} />
            </Inline>
          )}
        {!inputComponent &&
          releaseContext !== 'published' &&
          concept.childConcepts?.length == 0 &&
          concept.level == 5 && (
            <Inline>
              <StructureDetailDialogue
                type={'warn'}
                title={'Taxonomy Manager Structure Notice'}
                message={
                  'This concept is at the maximum Taxonomy Manager hierarchy depth of 5 levels. Additional child terms are not shown in the hierarchy tree.'
                }
              />
              <ConceptEditAction action={'remove'} handler={handleRemoveConcept} />
            </Inline>
          )}
        {concept?.childConcepts && concept?.childConcepts?.length > 0 && concept.level == 5 && (
          <Inline>
            <StructureDetailDialogue
              type={'error'}
              title={'Taxonomy Manager Structure Warning'}
              message={
                'This concept has unlisted child concepts. The maximum validated hierarchy depth is 5 levels.'
              }
            />
            {!inputComponent && releaseContext !== 'published' && (
              <ConceptEditAction action={'remove'} handler={handleRemoveConcept} />
            )}
          </Inline>
        )}
      </Flex>
      {/* Child elements the next level down, if any */}
      {concept?.childConcepts &&
        concept.childConcepts.length > 0 &&
        concept?.level &&
        concept.level < 5 && (
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
