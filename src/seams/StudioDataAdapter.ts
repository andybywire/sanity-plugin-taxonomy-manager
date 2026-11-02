import {DocumentId, isVersionId} from '@sanity/id-utils'
import {useCallback, useMemo} from 'react'
import {useClient} from 'sanity'
import {useListeningQuery} from 'sanity-plugin-utils'

import type {
  ConceptPlan,
  ConceptSearchParams,
  ConceptSearchResult,
  ConceptTreeParams,
  PublishedConceptsParams,
  TaxonomyDataPort,
  WatchResult,
} from '../core/ports'
import {type ConceptEdit, conceptPlanEdits} from '../core/mutations'
import {
  conceptSearchBuilder,
  inputBuilder,
  publishedConceptsBuilder,
  trunkBuilder,
} from '../core/queries'
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
const CONCEPT_SEARCH_QUERY = conceptSearchBuilder()

// The tree queries, built once for the same reason. A fresh object here meant
// the listener was torn down and rebuilt on *every render* of the tree — and a
// teardown drops whatever refetch that subscription had pending. A mutation's
// own re-render could therefore race the refetch it triggered: the replacement
// subscription fetches immediately on `welcome`, before Content Lake has made
// the mutation query-visible, and the delayed refetch that would have caught it
// died with the old subscription. The tree then stays stale until something
// else mutates or the view reloads.
const TRUNK_TREE_QUERY = {
  fetch: trunkBuilder(),
  listen: `*[_type == "skosConcept" || _type == "skosConceptScheme" ]`,
}
const INPUT_TREE_QUERY = {
  fetch: inputBuilder(),
  listen: `*[_type == "skosConcept" || _id == $id]`,
}

function useWatchTree(params: ConceptTreeParams): WatchResult<DocumentConcepts> {
  const isInput = params.mode === 'input'
  const result = useListeningQuery<DocumentConcepts>(
    isInput ? INPUT_TREE_QUERY : TRUNK_TREE_QUERY,
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

function useSearchConcepts(): (params: ConceptSearchParams) => Promise<ConceptSearchResult[]> {
  const client = useClient({apiVersion: MUTATION_API_VERSION})
  return useCallback(
    (params: ConceptSearchParams) =>
      client.fetch<ConceptSearchResult[]>(
        CONCEPT_SEARCH_QUERY,
        {
          excludeIds: [...params.excludeIds],
          searchQuery: params.searchQuery,
          allowBroaderInScheme: params.allowBroaderInScheme ?? true,
        },
        // The perspective the tree is rendering, so the candidates and the
        // exclusion list agree. `_id` arrives normalized to published form
        // under a release as well as under drafts, so the scheme's published
        // references can be excluded without reconciling ids either way.
        {perspective: params.perspective === undefined ? 'drafts' : [params.perspective]},
      ),
    [client],
  )
}

/**
 * One {@link ConceptEdit} as an Actions API action.
 *
 * `document.edit` takes the id of the document to patch under one of two keys,
 * and that key is the only thing separating a draft from a release version:
 * `draftId` or `versionId`. Either way the action creates that document **from
 * the published one** when it does not exist, which is both why no
 * `version.create` is needed here and why the seam never has to hold a whole
 * document. `version.create` would in fact be a trap: it is not idempotent, and
 * an action array is atomic, so a blind create-then-patch fails outright the
 * second time a concept is touched in the same release.
 *
 * `@sanity/client@7.27.0` types `EditAction` with `draftId` alone, so this goes
 * out through `client.request` rather than `client.action` — the workaround
 * Sanity's own Actions API guide gives for exactly this gap.
 */
function toAction(edit: ConceptEdit): Record<string, unknown> {
  if (edit.op === 'create') {
    return {
      actionType: 'sanity.action.document.create',
      publishedId: edit.publishedId,
      attributes: edit.attributes,
      // The id is a freshly generated uuid, so a published document under it
      // cannot exist; if one somehow does, failing is the honest outcome.
      ifExists: 'fail',
    }
  }
  const idKey = isVersionId(DocumentId(edit.targetId)) ? 'versionId' : 'draftId'
  return {
    actionType: 'sanity.action.document.edit',
    publishedId: edit.publishedId,
    [idKey]: edit.targetId,
    patch: edit.patch,
  }
}

function useApplyConceptPlan(): (plan: ConceptPlan) => Promise<void> {
  const client = useClient({apiVersion: MUTATION_API_VERSION})
  return useCallback(
    async (plan: ConceptPlan): Promise<void> => {
      // All of the mutation logic is `conceptPlanEdits`, in the pure core. This
      // replays it: one array of actions, applied atomically, so a plan that
      // touches two documents can never half-land.
      await client.request({
        uri: `/data/actions/${client.config().dataset}`,
        method: 'POST',
        body: {actions: conceptPlanEdits(plan).map(toAction)},
      })
    },
    [client],
  )
}

export const studioDataAdapter: TaxonomyDataPort = {
  useWatchTree,
  useSearchConcepts,
  useWatchPublishedConcepts,
  useApplyConceptPlan,
  useSemanticRecommendations,
}
