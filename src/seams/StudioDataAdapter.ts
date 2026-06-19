import {useCallback} from 'react'
import {useClient} from 'sanity'
import {useListeningQuery} from 'sanity-plugin-utils'

import type {
  ConceptPlan,
  ConceptTreeParams,
  SemanticRecommendationsResult,
  TaxonomyDataPort,
  WatchResult,
} from '../core/ports'
import {inputBuilder, trunkBuilder} from '../core/queries'
import {useEmbeddingsRecs} from '../hooks/useEmbeddingsRecs'
import type {DocumentConcepts, EmbeddingsIndexConfig} from '../types'

/**
 * #### Studio Data Adapter
 * The default `TaxonomyDataPort` implementation: today's behavior, lifted
 * verbatim behind the interface. Tree watching stays on Studio's
 * `documentStore.listenQuery` (via `useListeningQuery`), mutations replay
 * `core/mutations` plans onto `client.transaction()`, and recommendations
 * delegate to the existing embeddings hook (replaced in Stage 5). Behavior is
 * intended to be identical to the pre-port components/hooks.
 */

// Content Releases API version — must be preserved on the mutation path.
const MUTATION_API_VERSION = '2025-02-19'

function useWatchTree(params: ConceptTreeParams): WatchResult<DocumentConcepts> {
  const isInput = params.mode === 'input'
  const result = useListeningQuery<DocumentConcepts>(
    {
      fetch: isInput ? inputBuilder() : trunkBuilder(),
      listen: isInput
        ? `*[_type == "skosConcept" || _id == $id]`
        : `*[_type == "skosConcept" || _type == "skosConceptScheme" ]`,
    },
    {
      params: isInput
        ? // GROQ's select($branchId != null => …) needs null, not ''. ListenQueryParams
          // rejects null, so we cast past it — preserved from the original InputHierarchy.
          ({id: params.documentId, branchId: params.branchId} as any)
        : {id: params.documentId},
      options: {
        perspective: params.perspective === undefined ? 'drafts' : [params.perspective],
      },
    }
  ) as {data: DocumentConcepts | null; loading: boolean; error: unknown}

  return {
    data: result.data ?? null,
    loading: result.loading,
    error: result.error ? (result.error as Error) : null,
  }
}

function useApplyConceptPlan(): (plan: ConceptPlan) => Promise<void> {
  const client = useClient({apiVersion: MUTATION_API_VERSION})
  return useCallback(
    async (plan: ConceptPlan): Promise<void> => {
      if (plan.kind === 'remove') {
        await client
          .transaction()
          .createIfNotExists(plan.createIfNotExists)
          .patch(plan.schemeId, (patch) => patch.unset(plan.unsetPaths))
          .commit()
        return
      }
      await client
        .transaction()
        .createIfNotExists(plan.createIfNotExists)
        .create(plan.create)
        .patch(plan.schemeId, (patch) =>
          patch.setIfMissing({[plan.appendField]: []}).append(plan.appendField, [plan.reference])
        )
        .commit({autoGenerateArrayKeys: true})
    },
    [client]
  )
}

function useSemanticRecommendations(
  config?: EmbeddingsIndexConfig
): SemanticRecommendationsResult {
  return useEmbeddingsRecs(config)
}

export const studioDataAdapter: TaxonomyDataPort = {
  useWatchTree,
  useApplyConceptPlan,
  useSemanticRecommendations,
}
