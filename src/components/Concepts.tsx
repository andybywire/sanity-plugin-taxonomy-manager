import {Inline, Box, Flex, Card} from '@sanity/ui'
import {useCallback, useContext, useState} from 'react'

import {ReleaseContext, SchemeContext} from '../context'
import {useConceptRowDnd, useCreateConcept, useRemoveConcept} from '../hooks'
import type {ChildConceptTerm, ConceptSchemeDocument} from '../types'

import {ChildConcepts} from './ChildConcepts'
import {ConceptDetailDialogue} from './interactions/ConceptDetailDialogue'
import {ConceptDragHandle} from './interactions/ConceptDragHandle'
import {ConceptDetailLink} from './interactions/ConceptDetailLink'
import {ConceptEditAction} from './interactions/ConceptEditAction'
import {ConceptRowMenu} from './interactions/ConceptRowMenu'
import {ConceptSelectLink} from './interactions/ConceptSelectLink'
import {MoveConceptDialog} from './interactions/MoveConceptDialog'
import {ToggleButton} from './interactions/ToggleButton'

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
  const releaseContext = useContext(ReleaseContext)

  const hasTopConcept = !!document.displayed?.topConcepts?.length && !inputComponent

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
    removeConcept(concept.id, 'concept', concept?.prefLabel)
  }, [concept.id, concept?.prefLabel, removeConcept])

  // An orphan has no broader term in this scheme, so it can be given one — a
  // single patch to this concept, the same as any other move. Gated to drafts
  // for the same reason the nested rows are: a release cannot be targeted yet.
  const [moveOpen, setMoveOpen] = useState(false)
  const openMove = useCallback(() => setMoveOpen(true), [])
  const closeMove = useCallback(() => setMoveOpen(false), [])
  const canMove = !inputComponent && releaseContext === undefined

  const dnd = useConceptRowDnd({
    concept,
    parentId: null,
    draggable: canMove,
    droppable: !inputComponent,
  })
  // The drag handle is revealed on hover, to keep the tree's left edge quiet.
  const [rowHovered, setRowHovered] = useState(false)
  const onRowEnter = useCallback(() => setRowHovered(true), [])
  const onRowLeave = useCallback(() => setRowHovered(false), [])

  const hasChildren = (concept?.childConcepts?.length ?? 0) > 0
  const rowTone = dnd.isOver ? (dnd.accepts ? 'positive' : 'critical') : 'inherit'

  return (
    <Box className={levelVisibility}>
      <Card
        ref={dnd.setRowRef}
        radius={2}
        tone={rowTone}
        onMouseEnter={onRowEnter}
        onMouseLeave={onRowLeave}
        style={{opacity: dnd.isDragging ? 0.4 : undefined}}
      >
        <Flex align={'center'} justify={'space-between'} wrap={'nowrap'}>
          {/* Toggle, label, tag — left half of flexbox */}
          <Flex align="center" gap={0} flex={1} style={{minWidth: 0}}>
            {canMove && (
              <ConceptDragHandle
                handleProps={dnd.handleProps}
                visible={rowHovered || dnd.isDragging}
              />
            )}
            {hasChildren && <ToggleButton handler={handleToggle} visibility={levelVisibility} />}
            {!concept?.prefLabel && (
              <Box flex={1}>
                <ConceptDetailLink
                  concept={concept}
                  orphan={hasTopConcept}
                  inputComponent={inputComponent}
                />
              </Box>
            )}
            {concept?.prefLabel && (
              <Box flex={1}>
                {inputComponent ? (
                  <ConceptSelectLink
                    concept={concept}
                    selectConcept={selectConcept}
                    orphan={hasTopConcept}
                  />
                ) : (
                  <ConceptDetailLink
                    concept={concept}
                    orphan={hasTopConcept}
                    inputComponent={inputComponent}
                  />
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
          {canMove && (
            <ConceptRowMenu
              conceptId={concept.id}
              label={concept.prefLabel || '[new concept]'}
              onMove={openMove}
            />
          )}
        </Flex>
      </Card>
      {moveOpen && <MoveConceptDialog concept={concept} parentId={null} onClose={closeMove} />}
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
