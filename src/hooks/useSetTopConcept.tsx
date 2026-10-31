import {useToast} from '@sanity/ui/toast'
import {nanoid} from 'nanoid'
import {useCallback, useContext} from 'react'

import {OptimisticTreeContext} from '../context'
import {planSetTopConcept} from '../core/mutations'
import {useTaxonomyDataPort} from '../seams/TaxonomyPortContext'
import type {ChildConceptTerm, ConceptSchemeDocument} from '../types'

/**
 * #### Set Top Concept Hook
 * Promotes an orphan to a top concept of the scheme, or demotes a top concept
 * back to a plain one. The release-aware transaction is planned purely in
 * `core/mutations`; this hook supplies the reference key, replays the plan
 * through the data port, and handles the toast.
 *
 * The tree is updated optimistically: the row moves between the root's two
 * lists at once (see `core/tree/setTopConcept`), and moves back if the mutation
 * fails. Without it the row keeps its old place until the view is reloaded,
 * while the toast says the change has landed.
 */
export function useSetTopConcept(document: ConceptSchemeDocument) {
  const toast = useToast()
  const port = useTaxonomyDataPort()
  const applyConceptPlan = port.useApplyConceptPlan()
  const {markTopConcept, unmarkTopConcept} = useContext(OptimisticTreeContext)

  return useCallback(
    (concept: ChildConceptTerm, isTopConcept: boolean) => {
      const plan = planSetTopConcept({
        scheme: document.displayed,
        concept: {id: concept.id, _originalId: concept._originalId},
        isTopConcept,
        referenceKey: nanoid(),
      })

      const label = concept.prefLabel ? `"${concept.prefLabel}"` : 'Concept'
      const change = {conceptId: concept.id, isTopConcept}

      // Move the row now; the live listener reconciles after.
      markTopConcept(change)

      applyConceptPlan(plan)
        .then(() => {
          toast.push({
            closable: true,
            status: 'success',
            title: isTopConcept
              ? `${label} promoted to top concept`
              : `${label} demoted to concept`,
          })
        })
        .catch((err) => {
          // Put the row back where it was.
          unmarkTopConcept(change)
          toast.push({
            closable: true,
            status: 'error',
            title: isTopConcept ? 'Error promoting concept' : 'Error demoting concept',
            description: err instanceof Error ? err.message : 'Unknown error occurred',
          })
        })
    },
    [applyConceptPlan, document.displayed, toast, markTopConcept, unmarkTopConcept],
  )
}
