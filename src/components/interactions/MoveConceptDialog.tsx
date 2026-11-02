import {DocumentId, getPublishedId} from '@sanity/id-utils'
import {Box, Button, Card, Dialog, Stack, Text} from '@sanity/ui'
import {useCallback, useContext, useMemo, useState} from 'react'

import {SchemeContext, TreeContext} from '../../context'
import {canMoveConcept, findConcept} from '../../core/tree/moveConcept'
import {useMoveConcept} from '../../hooks'
import type {ChildConceptTerm, ConceptSchemeDocument} from '../../types'
import {InputHierarchy} from '../inputs/InputHierarchy'

/**
 * #### Move Concept Dialog
 * Picks a new broader term for a concept, from the same tree browser the
 * reference inputs use. With no `parentId` it is an orphan being brought into
 * the hierarchy, so there is no broader term to drop and that option is absent. A destination the hierarchy cannot take — the concept
 * itself, one of its own narrower terms, a term it already has, or one deep
 * enough to push the subtree out of view — is explained in place rather than
 * applied, and the dialog stays open so another can be chosen.
 *
 * The tree it validates against is the one on screen, read from `TreeContext`,
 * so a move is judged against what the editor is actually looking at, including
 * any moves still settling.
 */
export function MoveConceptDialog({
  concept,
  parentId,
  onClose,
}: {
  concept: ChildConceptTerm
  /** The broader term being left, or `null` for an orphan being given one. */
  parentId: string | null
  onClose: () => void
}) {
  const scheme: ConceptSchemeDocument = useContext(SchemeContext) || ({} as ConceptSchemeDocument)
  const {concepts} = useContext(TreeContext)
  const moveConcept = useMoveConcept(scheme)
  const [refusal, setRefusal] = useState<string | null>(null)

  const tree = concepts ?? null
  const label = concept.prefLabel || '[new concept]'
  const parent = useMemo(
    () => (parentId === null ? undefined : findConcept(tree, parentId)),
    [tree, parentId],
  )
  const parentLabel = parent?.prefLabel || 'its broader term'

  const from = useMemo(
    () => (parentId === null ? null : {id: parentId, prefLabel: parent?.prefLabel}),
    [parentId, parent?.prefLabel],
  )

  const handleSelect = useCallback(
    (selected: {_ref: string; _type: 'reference'; _originalId?: string}) => {
      const toParentId = getPublishedId(DocumentId(selected._ref))
      const check = canMoveConcept({
        data: tree,
        conceptId: concept.id,
        fromParentId: parentId,
        toParentId,
      })
      if (!check.allowed) {
        setRefusal(check.reason)
        return
      }
      moveConcept(concept, from, {
        id: toParentId,
        _originalId: selected._originalId,
        prefLabel: findConcept(tree, toParentId)?.prefLabel,
      })
      onClose()
    },
    [tree, concept, parentId, from, moveConcept, onClose],
  )

  const handleDetach = useCallback(() => {
    moveConcept(concept, from, null)
    onClose()
  }, [concept, from, moveConcept, onClose])

  return (
    <Dialog
      header={`Move “${label}”`}
      id={`move-concept-${concept.id}`}
      onClose={onClose}
      // A picker, so it dismisses on an outside click — the same split Studio
      // draws between choosing something and confirming something. Nothing is
      // lost by closing: a destination has been chosen or it has not.
      onClickOutside={onClose}
      width={1}
      zOffset={900}
    >
      <Stack gap={4} padding={4}>
        <Text muted size={1}>
          {`Choose the concept that should become the broader term for “${label}”:`}
        </Text>

        {refusal && (
          <Card padding={3} radius={2} shadow={1} tone="caution">
            <Text size={1}>{refusal}</Text>
          </Card>
        )}

        <Box>
          {/*
            The browser itself, not a nested TreeView: the dialog already sits
            inside the scheme and perspective contexts a TreeView would set up,
            so going straight to InputHierarchy avoids re-reading the Studio
            perspective and re-providing what is already here.
          */}
          <InputHierarchy branchId={null} inputComponent selectConcept={handleSelect} expanded />
        </Box>

        {/* Nothing to drop when the concept has no broader term to begin with. */}
        {parentId !== null && (
          <Card borderTop paddingTop={4}>
            <Stack gap={3}>
              <Text muted size={1}>
                {`Or remove “${label}” from this point in the hierarchy. It will either become a top level term, or remain a child of any other broader terms assigned to it.`}
              </Text>
              <Button
                text={`Remove “${parentLabel}” as a broader term`}
                mode="ghost"
                tone="critical"
                onClick={handleDetach}
              />
            </Stack>
          </Card>
        )}
      </Stack>
    </Dialog>
  )
}
