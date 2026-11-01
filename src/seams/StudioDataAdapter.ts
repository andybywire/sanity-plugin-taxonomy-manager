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
import {conceptMovePatch, insertBroaderPatch, insertSchemePatch} from '../core/mutations'
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
        // Drafts, so `_id` arrives normalized and the scheme's published
        // references can be excluded without reconciling draft ids.
        {perspective: 'drafts'},
      ),
    [client],
  )
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
      if (plan.kind === 'insertRoot') {
        // Scheme only — no broader reference is written for a concept at the
        // root — so this stays on the transaction path and works in a release.
        await client
          .transaction()
          .createIfNotExists(plan.createIfNotExists)
          .patch(plan.schemeId, (patch) =>
            patch.setIfMissing({[plan.appendField]: []}).append(plan.appendField, [plan.reference]),
          )
          .commit()
        return
      }
      if (plan.kind === 'insert') {
        if (plan.isInRelease) {
          throw new Error(
            'Inserting a concept inside a content release is not supported yet. ' +
              'Switch to the drafts perspective to add existing concepts.',
          )
        }
        // One array, applied atomically. Either edit alone leaves the scheme
        // wrong: a member with no broader term renders at the root as an
        // orphan, a broader term on a non-member renders nowhere. `document
        // .edit` rather than a transaction because neither document is held in
        // full here, so there is nothing to `createIfNotExists` from.
        await client.action([
          {
            actionType: 'sanity.action.document.edit',
            publishedId: plan.schemeEdit.publishedId,
            draftId: plan.schemeEdit.targetId,
            patch: insertSchemePatch(plan),
          },
          {
            actionType: 'sanity.action.document.edit',
            publishedId: plan.conceptEdit.publishedId,
            draftId: plan.conceptEdit.targetId,
            patch: insertBroaderPatch(plan),
          },
        ])
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
  useSearchConcepts,
  useWatchPublishedConcepts,
  useApplyConceptPlan,
  useSemanticRecommendations,
}
