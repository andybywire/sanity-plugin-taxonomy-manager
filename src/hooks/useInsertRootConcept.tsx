import {useToast} from '@sanity/ui/toast'
import {uuid} from '@sanity/uuid'
import {useCallback, useContext} from 'react'

import {OptimisticTreeContext} from '../context'
import {inSchemeBroaderRef, planInsertRootConcept} from '../core/mutations'
import type {ConceptSearchResult} from '../core/ports'
import {useTaxonomyDataPort} from '../seams/TaxonomyPortContext'
import type {ConceptSchemeDocument} from '../types'

import {useOpenNewConceptPane} from './useOpenNewConceptPane'

/**
 * #### Insert Root Concept Hook
 * Adds an existing concept to a scheme at its root — as a top concept, or as a
 * plain member with no broader term supplied.
 *
 * One document, unlike inserting as a child: a concept at the root needs no
 * `broader` written, so this is an append to the scheme and nothing else. That
 * is also why it works inside a release.
 *
 * **A plain concept does not always land at the root.** The query reads
 * `isOrphan` as "no broader term that is a member of this scheme", so a concept
 * that already has one renders under it instead. That is correct — it really is
 * a child of something here — and the optimistic update puts it there rather
 * than at the root, so the tree never shows a position it is about to leave.
 * Picking a *top* concept cannot hit this: the picker does not offer candidates
 * holding an in-scheme broader term.
 *
 * The concept opens in the pane to the right either way. An already-published
 * concept added to a published scheme needs no publishing, so that pane has
 * nothing for the editor to do — but the behavior is worth more than the one
 * exception, and the open pane also shows *where* the concept landed.
 */
export function useInsertRootConcept(document: ConceptSchemeDocument) {
  const toast = useToast()
  const port = useTaxonomyDataPort()
  const applyConceptPlan = port.useApplyConceptPlan()
  const openInNewPane = useOpenNewConceptPane()
  const {markInserted, unmarkInserted, markRootInserted, unmarkRootInserted} =
    useContext(OptimisticTreeContext)

  return useCallback(
    (concept: ConceptSearchResult, conceptType: 'topConcept' | 'concept') => {
      const {topConcepts = [], concepts = []} = document.displayed ?? {}
      const memberIds = [...topConcepts, ...concepts].map((reference) => reference._ref)

      const plan = planInsertRootConcept({
        scheme: document.displayed,
        concept: {id: concept.id, _originalId: concept._originalId},
        conceptType,
        referenceKey: uuid(),
      })

      // Where it will actually render: under an existing broader term if it has
      // one here, at the root otherwise.
      const landsUnder =
        conceptType === 'concept' ? inSchemeBroaderRef(concept.broaderRefs, memberIds) : null

      const nested = {
        conceptId: concept.id,
        prefLabel: concept.prefLabel,
        parentId: landsUnder ?? '',
      }
      const root = {
        conceptId: concept.id,
        prefLabel: concept.prefLabel,
        asTopConcept: conceptType === 'topConcept',
      }
      if (landsUnder) markInserted(nested)
      else markRootInserted(root)

      applyConceptPlan(plan)
        .then(() => {
          toast.push({
            closable: true,
            status: 'success',
            title:
              conceptType === 'topConcept'
                ? `"${concept.prefLabel}" added as a top concept`
                : `"${concept.prefLabel}" added to this scheme`,
          })
          openInNewPane(concept.id)
        })
        .catch((err) => {
          if (landsUnder) unmarkInserted(nested)
          else unmarkRootInserted(root)
          toast.push({
            closable: true,
            status: 'error',
            title: 'Error adding concept',
            description: err instanceof Error ? err.message : 'Unknown error occurred',
          })
        })
    },
    [
      applyConceptPlan,
      document.displayed,
      toast,
      openInNewPane,
      markInserted,
      unmarkInserted,
      markRootInserted,
      unmarkRootInserted,
    ],
  )
}
