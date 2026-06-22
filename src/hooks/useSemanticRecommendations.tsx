import {useState, useCallback, useMemo} from 'react'
import {useClient, useGetFormValue} from 'sanity'

import {
  assembleQueryText,
  recommendationsErrorMessage,
  recommendationsQuery,
  toConceptRecommendations,
  type RecommendationRow,
} from '../core/semanticRecommendations'
import type {ConceptRecommendation, SemanticSearchConfig} from '../types'

/**
 * GROQ API version for the recommendations query. `text::semanticSimilarity()`
 * is documented as a stable function, but its minimum dated API version isn't
 * published; `vX` is the channel known to expose it (and what the pre-migration
 * embeddings hook already used, so this is no stability regression). Pin to a
 * dated version once confirmed against the live API.
 */
const SEMANTIC_API_VERSION = 'vX'

/** Default number of recommended terms — preserved from the prior behavior. */
const DEFAULT_MAX_RESULTS = 3

/**
 * Studio-side implementation of the semantic-recommendations seam. Reads the
 * configured form fields, runs the `text::semanticSimilarity()` query against the
 * published perspective, and exposes the scored concepts plus a friendly error.
 * All decision-bearing logic (query, validation, mapping, error wording) lives in
 * the pure `core/semanticRecommendations`; this hook only wires Studio (client +
 * form values) and React state.
 */
export function useSemanticRecommendations(semanticSearch?: SemanticSearchConfig) {
  // Recommend established terms: score against the published perspective, matching
  // the old published embeddings index. Memoized so the client ref stays stable.
  const baseClient = useClient({apiVersion: SEMANTIC_API_VERSION})
  const client = useMemo(() => baseClient.withConfig({perspective: 'published'}), [baseClient])
  const getFormValue = useGetFormValue()

  const [conceptRecs, setConceptRecs] = useState<ConceptRecommendation[]>([])
  const [recsError, setRecsError] = useState<string | null>(null)

  const triggerSearch = useCallback(
    (schemeId?: string) => {
      setRecsError(null)
      // Recommendations are scoped to the field's scheme; without a resolved
      // schemeId there is nothing to scope against, so skip the search.
      if (!semanticSearch || !schemeId) return
      const {fieldReferences, maxResults = DEFAULT_MAX_RESULTS} = semanticSearch

      let searchQuery: string
      try {
        searchQuery = assembleQueryText(
          fieldReferences.map((name) => ({name, value: getFormValue([name])}))
        )
      } catch (error) {
        setRecsError(
          error instanceof Error ? error.message : 'One or more required fields are empty'
        )
        return
      }

      client
        .fetch(recommendationsQuery(), {searchQuery, maxResults, schemeId})
        .then((rows: RecommendationRow[]) => setConceptRecs(toConceptRecommendations(rows)))
        .catch((error) => {
          console.error('Error fetching semantic recommendations: ', error)
          setRecsError(recommendationsErrorMessage(error))
        })
    },
    [client, getFormValue, semanticSearch]
  )

  return {conceptRecs, recsError, triggerSearch}
}
