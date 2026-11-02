import {AddCircleIcon} from '@sanity/icons/AddCircle'
import {InsertBelowIcon} from '@sanity/icons/InsertBelow'
import {Box, Card, Flex, Inline} from '@sanity/ui'
import {useCallback, useContext, useState} from 'react'

import {ReleaseContext, SchemeContext, TreeContext} from '../context'
import {conceptStatusMarkers, hasDraftVersion} from '../core/publicationStatus'
import {hasRootOrphans} from '../core/tree/rootOrphans'
import {useConceptRowDnd, useCreateConcept, useRemoveConcept, useSetTopConcept} from '../hooks'
import type {ChildConceptTerm, ConceptSchemeDocument} from '../types'

import {ChildConcepts} from './ChildConcepts'
import {ConceptDetailDialogue} from './interactions/ConceptDetailDialogue'
import {ConceptDetailLink} from './interactions/ConceptDetailLink'
import {ConceptDragHandle} from './interactions/ConceptDragHandle'
import {ConceptEditAction} from './interactions/ConceptEditAction'
import {ConceptRowMenu} from './interactions/ConceptRowMenu'
import {InsertConceptDialog} from './interactions/InsertConceptDialog'
import {ConceptSelectLink} from './interactions/ConceptSelectLink'
import {MoveConceptDialog} from './interactions/MoveConceptDialog'
import {StructureDetailDialogue} from './interactions/StructureDetailDialogue'
import {ToggleButton} from './interactions/ToggleButton'

/** The deepest level the tree renders; see `core/tree/moveConcept`. */
const MAX_VISIBLE_LEVEL = 5

/**
 * Where a row sits in the scheme. Everything that differs between rows follows
 * from this and nothing else:
 *
 * | kind     | badge        | bold | can move | `parentId` |
 * |----------|--------------|------|----------|------------|
 * | `top`    | top concept  | yes  | no       | `null`     |
 * | `orphan` | orphan       | no   | yes      | `null`     |
 * | `child`  | —            | no   | yes      | its parent |
 *
 * A top concept cannot move because its reference would have to travel between
 * the scheme's `topConcepts` and `concepts` arrays — a second document, and the
 * one case the move plan does not cover.
 */
export type ConceptRowKind = 'top' | 'orphan' | 'child'

/**
 * #### Concept Row
 * One row of the hierarchy: a grip, a caret, a label and the row's actions,
 * with whatever hangs beneath it.
 *
 * The anatomy is declared once here rather than reassembled per kind, so a row's
 * alignment follows from its structure instead of from which conditionals
 * happened to fire. Left to right the slots are always the same; a slot either
 * holds its control or holds nothing.
 */
export const ConceptRow = ({
  concept,
  kind,
  parentId,
  selectConcept,
  inputComponent = false,
}: {
  concept: ChildConceptTerm
  kind: ConceptRowKind
  /**
   * The concept this row hangs under, or `null` at the root. A concept with
   * more than one broader term renders at several points in the tree, so the
   * pair (`concept.id`, `parentId`) — not the id alone — names this occurrence.
   */
  parentId: string | null
  selectConcept: (conceptId: {
    _ref: string
    _type: 'reference'
    _originalId: string | undefined
  }) => void
  inputComponent: boolean
}) => {
  const document: ConceptSchemeDocument = useContext(SchemeContext) || ({} as ConceptSchemeDocument)
  const releaseContext = useContext(ReleaseContext)
  const {
    globalVisibility: {treeVisibility} = {treeVisibility: 'open' as const},
    concepts: tree,
    publishedIds,
  } = useContext(TreeContext) || {}

  const createConcept = useCreateConcept(document)
  const removeConcept = useRemoveConcept(document)
  const setTopConcept = useSetTopConcept(document)

  const isTop = kind === 'top'
  const level = concept.level ?? 0
  const hasChildren = (concept.childConcepts?.length ?? 0) > 0
  const label = concept.prefLabel || '[new concept]'

  // Editing is off in the published view, and every edit affordance now shares
  // that one gate. Moving and inserting used to be narrower — drafts only,
  // because both patch a *concept* document and `EditAction` appeared to have
  // no way to name a release version. It has one: `versionId` in place of
  // `draftId`, which also creates the version from the published document. So
  // there is nothing left for a release to be excluded from.
  const canEdit = !inputComponent && releaseContext !== 'published'
  // A top concept's move would have to cross between the scheme's two arrays,
  // which is promotion/demotion rather than a re-parent, so it is not offered
  // here.
  const canMove = canEdit && !isTop
  // Only an orphan can be promoted: a concept with a broader term in this
  // scheme would render both at the root and under that parent. Gated on the
  // row's kind rather than on the orphan badge, which additionally wants the
  // scheme to have top concepts already — exactly the case where promoting the
  // first one matters.
  // The depth cap on inserting is the same one the add control follows:
  // children of a level-5 concept are fetched but never rendered.
  const canInsert = canEdit && level < MAX_VISIBLE_LEVEL
  const canPromote = canEdit && kind === 'orphan'
  const canDemote = canEdit && isTop
  // A top concept cannot be dragged, but a sibling orphan can. Holding the slot
  // open keeps those orphans from reading as nested — and with nothing
  // draggable at the root at all, the slot would be dead space.
  const reservesGrip = isTop && canEdit && hasRootOrphans(tree ?? null)
  // A child with no children of its own holds the caret slot open, so every
  // label at a level shares one vertical edge. It sits to the left of the grip
  // rather than between grip and label: only one grip shows at a time, so they
  // need not align, and the grip reads better kept beside its own label.
  const reservesCaret = kind === 'child' && !hasChildren
  // `undefined` means the markers are gated off; `null` only means the query
  // has not landed yet, which no longer blanks the row. A node the drafts
  // perspective returned whose `_originalId` is not a draft *is* the published
  // document, so its dot needs no query — and a node that is a draft has at
  // least its ring. Every row therefore carries a marker, and the query is
  // consulted for one thing only: whether a drafted concept is also published.
  const hasDraft = hasDraftVersion(concept._originalId)
  const statusMarkers =
    publishedIds === undefined
      ? undefined
      : conceptStatusMarkers({
          hasDraft,
          hasPublished: !hasDraft || (publishedIds?.has(concept.id) ?? false),
        })

  const handleAddChild = useCallback(() => {
    createConcept('concept', concept)
  }, [concept, createConcept])

  const handlePromote = useCallback(() => {
    setTopConcept(concept, true)
  }, [concept, setTopConcept])

  const handleDemote = useCallback(() => {
    setTopConcept(concept, false)
  }, [concept, setTopConcept])

  const handleRemoveConcept = useCallback(() => {
    removeConcept(concept.id, isTop ? 'topConcept' : 'concept', concept.prefLabel)
  }, [concept.id, concept.prefLabel, isTop, removeConcept])

  const [insertOpen, setInsertOpen] = useState(false)
  const openInsert = useCallback(() => setInsertOpen(true), [])
  const closeInsert = useCallback(() => setInsertOpen(false), [])

  const [moveOpen, setMoveOpen] = useState(false)
  const openMove = useCallback(() => setMoveOpen(true), [])
  const closeMove = useCallback(() => setMoveOpen(false), [])

  const [levelVisibility, setLevelVisibility] = useState<'open' | 'closed'>(
    treeVisibility === 'closed' && concept.hasMatchingDescendant
      ? 'open'
      : treeVisibility || 'open',
  )
  const handleToggle = useCallback(() => {
    setLevelVisibility((prev) => (prev === 'open' ? 'closed' : 'open'))
  }, [])

  const dnd = useConceptRowDnd({
    concept,
    parentId,
    draggable: canMove,
    droppable: !inputComponent,
  })
  // The grip is revealed on hover, to keep the tree's left edge quiet.
  const [rowHovered, setRowHovered] = useState(false)
  const onRowEnter = useCallback(() => setRowHovered(true), [])
  const onRowLeave = useCallback(() => setRowHovered(false), [])

  const rowTone = dnd.isOver ? (dnd.accepts ? 'positive' : 'critical') : 'inherit'
  // The "orphan" badge only means anything in a scheme that has top concepts.
  const showsOrphanBadge =
    kind === 'orphan' && !!document.displayed?.topConcepts?.length && !inputComponent

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
        <Flex align="center" justify="space-between" wrap="nowrap">
          {/* (reserved caret) · grip · caret · label */}
          <Flex align="center" gap={0} flex={1} style={{minWidth: 0}}>
            {reservesCaret && <ToggleButton reserved />}
            {(canMove || reservesGrip) && (
              <ConceptDragHandle
                handleProps={canMove ? dnd.handleProps : undefined}
                visible={canMove && (rowHovered || dnd.isDragging)}
              />
            )}
            {hasChildren && <ToggleButton handler={handleToggle} visibility={levelVisibility} />}
            {/* minWidth lets this shrink below its content. Without it a flex
                item's min-width is `auto`, so a long label widens the whole
                left group and shunts the markers and actions out of line. */}
            <Box flex={1} style={{minWidth: 0}}>
              {inputComponent && concept.prefLabel ? (
                <ConceptSelectLink
                  concept={concept}
                  selectConcept={selectConcept}
                  topConcept={isTop}
                  orphan={showsOrphanBadge}
                />
              ) : (
                <ConceptDetailLink
                  concept={concept}
                  topConcept={isTop}
                  orphan={showsOrphanBadge}
                  inputComponent={inputComponent}
                  statusMarkers={statusMarkers}
                />
              )}
            </Box>
          </Flex>

          {/* actions */}
          <Inline gap={1}>
            {inputComponent && <ConceptDetailDialogue concept={concept} />}
            {level === MAX_VISIBLE_LEVEL && (
              <StructureDetailDialogue
                type={hasChildren ? 'error' : 'warn'}
                title={
                  hasChildren
                    ? 'Taxonomy Manager structure warning'
                    : 'Taxonomy Manager structure notice'
                }
                message={
                  hasChildren
                    ? 'This concept has unlisted child concepts. The maximum validated hierarchy depth is 5 levels.'
                    : 'This concept is at the maximum Taxonomy Manager hierarchy depth of 5 levels. Additional child terms are not shown in the hierarchy tree.'
                }
              />
            )}
            {canEdit && level < MAX_VISIBLE_LEVEL && (
              <ConceptEditAction
                icon={AddCircleIcon}
                message="Add a new concept as a child of this concept"
                handler={handleAddChild}
              />
            )}
            {canInsert && (
              <ConceptEditAction
                icon={InsertBelowIcon}
                message="Insert an existing concept as a child of this concept"
                handler={openInsert}
              />
            )}
            {canEdit && (
              <ConceptRowMenu
                conceptId={concept.id}
                label={label}
                onMove={canMove ? openMove : undefined}
                onPromote={canPromote ? handlePromote : undefined}
                onDemote={canDemote ? handleDemote : undefined}
                onRemove={handleRemoveConcept}
              />
            )}
          </Inline>
        </Flex>
      </Card>

      {insertOpen && (
        <InsertConceptDialog target={{kind: 'child', concept}} onClose={closeInsert} />
      )}

      {moveOpen && <MoveConceptDialog concept={concept} parentId={parentId} onClose={closeMove} />}

      {hasChildren && level < MAX_VISIBLE_LEVEL && (
        <ChildConcepts
          concepts={concept.childConcepts!}
          parentId={concept.id}
          selectConcept={selectConcept}
          inputComponent={inputComponent}
          childVisibility={levelVisibility}
        />
      )}
    </Box>
  )
}
