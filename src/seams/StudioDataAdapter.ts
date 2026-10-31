import {useCallback, useMemo} from 'react'
import {useClient} from 'sanity'
import {useListeningQuery} from 'sanity-plugin-utils'

import type {
  ConceptPlan,
  ConceptTreeParams,
  PublishedConceptsParams,
  TaxonomyDataPort,
  WatchResult,
} from '../core/ports'
import {conceptMovePatch} from '../core/mutations'
import {inputBuilder, publishedConceptsBuilder, trunkBuilder} from '../core/queries'
import {useSemanticRecommendations} from '../hooks/useSemanticRecommendations'
import type {DocumentConcepts} from '../types'

/**
 * #### Studio Data Adapter
 * The default `TaxonomyDataPort` implementation: today's behavior, lifted
 * verbatim behind the interface. Tree watching stays on Studio's
 * `documentStore.listenQuery` (via `useListeningQuery`), scheme mutations replay
 * `core/mutations` plans onto `client.transaction()` while a concept move goes
 * through the Actions API (`client.action`), and recommendations run a
 * `text::semanticSimilarity()` GROQ query (`useSemanticRecommendations`). Watch
 * and mutation behavior matches the pre-port components; recommendations were
 * migrated off the deprecated Embeddings Index API in Stage 5.
 */

// Content Releases API version — must be preserved on the mutation path.
const MUTATION_API_VERSION = '2025-02-19'

// Built once. `useListeningQuery` keys its subscription effect on the query
// object's identity, so building it in the hook body would tear the listener
// down and set it up again on every render.
const PUBLISHED_CONCEPTS_QUERY = publishedConceptsBuilder()

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
    },
  ) as {data: DocumentConcepts | null; loading: boolean; error: unknown}

  return {
    data: result.data ?? null,
    loading: result.loading,
    error: result.error ? (result.error as Error) : null,
  }
}

function useWatchPublishedConcepts(
  params: PublishedConceptsParams,
): WatchResult<ReadonlySet<string>> {
  const {ids} = params
  const result = useListeningQuery<string[]>(PUBLISHED_CONCEPTS_QUERY, {
    // ListenQueryParams types values as scalars; GROQ takes an array here, and
    // the same cast is made for the input tree's null branchId above.
    params: {ids} as any,
    options: {perspective: 'published'},
  }) as {data: string[] | null; loading: boolean; error: unknown}

  // A new Set per result, not per render: the row reads it on every pass.
  const data = useMemo(() => (result.data ? new Set(result.data) : null), [result.data])

  return {
    data,
    loading: result.loading,
    error: result.error ? (result.error as Error) : null,
  }
}

function useApplyConceptPlan(): (plan: ConceptPlan) => Promise<void> {
  const client = useClient({apiVersion: MUTATION_API_VERSION})
  return useCallback(
    async (plan: ConceptPlan): Promise<void> => {
      if (plan.kind === 'move') {
        if (plan.isInRelease) {
          throw new Error(
            'Moving a concept inside a content release is not supported yet. ' +
              'Switch to the drafts perspective to restructure the hierarchy.',
          )
        }
        // Not a transaction: the tree query projects a handful of fields, never
        // the concept document, so there is nothing to `createIfNotExists` from
        // when no draft exists. `document.edit` creates the draft from the
        // published document and patches it in one call.
        await client.action({
          actionType: 'sanity.action.document.edit',
          publishedId: plan.publishedId,
          draftId: plan.targetId,
          patch: conceptMovePatch(plan),
        })
        return
      }
      if (plan.kind === 'setTopConcept') {
        // Only the scheme is written, so this works in a release as well as in
        // drafts. The unset and the append name different arrays, so the order
        // Content Lake applies them in does not matter here.
        await client
          .transaction()
          .createIfNotExists(plan.createIfNotExists)
          .patch(plan.schemeId, (patch) =>
            patch
              .setIfMissing({[plan.appendField]: []})
              .unset(plan.unsetPaths)
              .append(plan.appendField, [plan.reference]),
          )
          .commit()
        return
      }
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
          patch.setIfMissing({[plan.appendField]: []}).append(plan.appendField, [plan.reference]),
        )
        .commit({autoGenerateArrayKeys: true})
    },
    [client],
  )
}

export const studioDataAdapter: TaxonomyDataPort = {
  useWatchTree,
  useWatchPublishedConcepts,
  useApplyConceptPlan,
  useSemanticRecommendations,
}
