import {useToast} from '@sanity/ui/toast'
import {uuid} from '@sanity/uuid'
import {useCallback, useContext} from 'react'

import {OptimisticTreeContext} from '../context'
import {planInsertConcept} from '../core/mutations'
import type {ConceptSearchResult} from '../core/ports'
import {useTaxonomyDataPort} from '../seams/TaxonomyPortContext'
import type {ChildConceptTerm, ConceptSchemeDocument} from '../types'

import {useOpenNewConceptPane} from './useOpenNewConceptPane'

/**
 * #### Insert Concept Hook
 * Files an existing concept as a child of another: the scheme gains it as a
 * member and the concept gains a broader term, in one atomic pair of actions
 * planned in `core/mutations`.
 *
 * Three things happen on success, and the third is the point. The tree shows
 * the concept at once, optimistically. Then its document opens in the pane to
 * the right — because both documents are now drafted, and that pane is where
 * the editor publishes the concept before publishing the scheme.
 *
 * The pane opens on the concept's published id, as the tree's own links do.
 * `useCreateConcept` opens a draft id instead, but only because a concept it
 * just created has no published document to open.
 */
export function useInsertConcept(document: ConceptSchemeDocument) {
  const toast = useToast()
  const port = useTaxonomyDataPort()
  const applyConceptPlan = port.useApplyConceptPlan()
  const openInNewPane = useOpenNewConceptPane()
  const {markInserted, unmarkInserted} = useContext(OptimisticTreeContext)

  return useCallback(
    (concept: ConceptSearchResult, broaderConcept: ChildConceptTerm) => {
      const plan = planInsertConcept({
        scheme: document.displayed,
        concept: {id: concept.id, _originalId: concept._originalId},
        broaderConcept: {id: broaderConcept.id, _originalId: broaderConcept._originalId},
        schemeKey: uuid(),
        broaderKey: uuid(),
      })

      const insert = {
        conceptId: concept.id,
        prefLabel: concept.prefLabel,
        parentId: broaderConcept.id,
      }
      markInserted(insert)

      applyConceptPlan(plan)
        .then(() => {
          toast.push({
            closable: true,
            status: 'success',
            title: `"${concept.prefLabel}" added to ${broaderConcept.prefLabel || 'this concept'}`,
          })
          openInNewPane(concept.id)
        })
        .catch((err) => {
          unmarkInserted(insert)
          toast.push({
            closable: true,
            status: 'error',
            title: 'Error inserting concept',
            description: err instanceof Error ? err.message : 'Unknown error occurred',
          })
        })
    },
    [applyConceptPlan, document.displayed, toast, openInNewPane, markInserted, unmarkInserted],
  )
}
