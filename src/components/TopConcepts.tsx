import {Flex, Inline, Box, Card} from '@sanity/ui'
import {useCallback, useContext, useState} from 'react'

import {ReleaseContext, SchemeContext, TreeContext} from '../context'
import {hasRootOrphans} from '../core/tree/rootOrphans'
import {useConceptRowDnd, useCreateConcept, useRemoveConcept} from '../hooks'
import type {ConceptSchemeDocument, TopConceptTerm} from '../types'

import {ChildConcepts} from './ChildConcepts'
import {ConceptDetailDialogue} from './interactions/ConceptDetailDialogue'
import {ConceptDetailLink} from './interactions/ConceptDetailLink'
import {ConceptDragHandle} from './interactions/ConceptDragHandle'
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
  const releaseContext = useContext(ReleaseContext)

  const createConcept = useCreateConcept(document)
  const removeConcept = useRemoveConcept(document)

  const [levelVisibility, setLevelVisibility] = useState(
    treeVisibility === 'closed' && concept.hasMatchingDescendant ? 'open' : treeVisibility,
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

  const dnd = useConceptRowDnd({
    concept,
    parentId: null,
    draggable: false,
    droppable: !inputComponent,
  })
  const rowTone = dnd.isOver ? (dnd.accepts ? 'positive' : 'critical') : 'inherit'
  // A top concept cannot be dragged, but a sibling orphan can. Without the slot
  // held open here, the orphans at the root read as though they were nested.
  // With nothing draggable at the root, the slot would be dead space, so a
  // scheme of top concepts alone keeps its left edge flush.
  const {concepts: tree} = useContext(TreeContext)
  const reservesHandleSlot =
    !inputComponent && releaseContext === undefined && hasRootOrphans(tree ?? null)

  return (
    <Box className={levelVisibility}>
      <Card
        ref={dnd.setRowRef}
        radius={2}
        tone={rowTone}
        style={{opacity: dnd.isDragging ? 0.4 : undefined}}
      >
        <Flex align={'center'} justify={'space-between'} wrap={'nowrap'}>
          {/* Toggle, label, tag — left half of flexbox */}
          <Flex align="center" gap={0} flex={1} style={{minWidth: 0}}>
            {reservesHandleSlot && <ConceptDragHandle visible={false} />}
            {concept?.childConcepts && concept.childConcepts.length > 0 && (
              <ToggleButton handler={handleToggle} visibility={levelVisibility} />
            )}
            {!concept?.prefLabel && (
              <Box flex={1}>
                <ConceptDetailLink concept={concept} topConcept inputComponent={inputComponent} />
              </Box>
            )}
            {concept?.prefLabel && (
              <Box flex={1}>
                {inputComponent ? (
                  <ConceptSelectLink concept={concept} selectConcept={selectConcept} topConcept />
                ) : (
                  <ConceptDetailLink concept={concept} topConcept inputComponent={inputComponent} />
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
      </Card>
      {/* Child Concepts */}
      {concept?.childConcepts && concept.childConcepts.length > 0 && (
        <ChildConcepts
          concepts={concept.childConcepts}
          parentId={concept.id}
          selectConcept={selectConcept}
          inputComponent={inputComponent}
          childVisibility={levelVisibility}
        />
      )}
    </Box>
  )
}
