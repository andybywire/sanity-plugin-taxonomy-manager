import {Inline, Box, Flex, Card} from '@sanity/ui'
import {useCallback, useContext, useState} from 'react'

import {ReleaseContext, SchemeContext, TreeContext} from '../context'
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
import {StructureDetailDialogue} from './interactions/StructureDetailDialogue'
import {ToggleButton} from './interactions/ToggleButton'

/**
 * #### Child Concept Component
 * Renders a list of child concepts and applicable
 * actions for a given concept.
 */
export const Children = ({
  concept,
  parentId,
  selectConcept,
  inputComponent = false,
}: {
  concept: ChildConceptTerm
  /**
   * The concept this row hangs under. A concept with more than one broader term
   * renders at several points in the tree, so the pair (`concept.id`,
   * `parentId`) — not the concept id alone — identifies this occurrence.
   */
  parentId: string
  selectConcept: (conceptId: {
    _ref: string
    _type: 'reference'
    _originalId: string | undefined
  }) => void
  inputComponent: boolean
}) => {
  const document: ConceptSchemeDocument = useContext(SchemeContext) || ({} as ConceptSchemeDocument)
  const releaseContext = useContext(ReleaseContext)
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

  // The move command is offered in the drafts perspective only: the published
  // view hides every edit affordance, and a move cannot target a release
  // version yet, so offering it there would only produce an error.
  const [moveOpen, setMoveOpen] = useState(false)
  const openMove = useCallback(() => setMoveOpen(true), [])
  const closeMove = useCallback(() => setMoveOpen(false), [])
  const canMove = !inputComponent && releaseContext === undefined

  const [levelVisibility, setLevelVisibility] = useState<'open' | 'closed'>(
    treeVisibility === 'closed' && concept.hasMatchingDescendant
      ? 'open'
      : treeVisibility || 'open',
  )

  const handleToggle = useCallback(() => {
    if (levelVisibility == 'open') {
      setLevelVisibility('closed')
    } else if (levelVisibility == 'closed') {
      setLevelVisibility('open')
    }
  }, [levelVisibility])

  const dnd = useConceptRowDnd({
    concept,
    parentId: parentId,
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
                <ConceptDetailLink concept={concept} inputComponent={inputComponent} />
              </Box>
            )}
            {concept?.prefLabel && (
              <Box flex={1}>
                {inputComponent ? (
                  <ConceptSelectLink concept={concept} selectConcept={selectConcept} />
                ) : (
                  <ConceptDetailLink concept={concept} inputComponent={inputComponent} />
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
                  title={'Taxonomy Manager structure notice'}
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
                title={'Taxonomy Manager structure warning'}
                message={
                  'This concept has unlisted child concepts. The maximum validated hierarchy depth is 5 levels.'
                }
              />
              {!inputComponent && releaseContext !== 'published' && (
                <ConceptEditAction action={'remove'} handler={handleRemoveConcept} />
              )}
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
      {moveOpen && <MoveConceptDialog concept={concept} parentId={parentId} onClose={closeMove} />}
      {/* Child elements the next level down, if any */}
      {concept?.childConcepts &&
        concept.childConcepts.length > 0 &&
        concept?.level &&
        concept.level < 5 && (
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
