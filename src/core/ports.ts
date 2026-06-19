import type {CreateConceptPlan, RemoveConceptPlan} from './mutations'
import type {DocumentConcepts, EmbeddingsIndexConfig, EmbeddingsResult} from '../types'

/**
 * #### Taxonomy Data Port
 * The single internal seam for everything that touches Sanity Studio or the
 * network: the live concept-tree query, concept-mutation transactions, and
 * semantic term recommendations. Components and mutation hooks talk to this
 * interface instead of `useListeningQuery`/`useClient` directly, so the render
 * tree can be exercised against an in-memory fake (`test/FakeDataPort`) and the
 * implementation can be swapped later (e.g. the embeddings → `semanticSimilarity`
 * migration in Stage 5, or the App SDK) without touching components.
 *
 * Members are hooks (`use*`): the tree seam wraps Studio's
 * `documentStore.listenQuery` and the mutation/embeddings seams read the Studio
 * client from React context, so they obey the rules of hooks. They are reached
 * via `useTaxonomyDataPort()` — default is the real `StudioDataAdapter`, and
 * tests inject a fake through `TaxonomyPortProvider`.
 */
export interface TaxonomyDataPort {
  /** Live concept tree for a scheme document (`trunk`) or a branch within it (`input`). */
  useWatchTree(params: ConceptTreeParams): WatchResult<DocumentConcepts>
  /** Replay a pure create/remove plan (`core/mutations`) onto a Studio transaction. */
  useApplyConceptPlan(): (plan: ConceptPlan) => Promise<void>
  /** Semantic term recommendations for the input components (embeddings today; swapped in Stage 5). */
  useSemanticRecommendations(config?: EmbeddingsIndexConfig): SemanticRecommendationsResult
}

/**
 * Perspective intent, mirroring `ReleaseContext` (`selectedPerspectiveName` from
 * `usePerspective()`): `undefined` ⇒ drafts, otherwise the named perspective.
 */
export type TaxonomyPerspective = string | undefined

/**
 * Which tree to watch. `trunk` is the full scheme hierarchy (the structure Tree
 * View); `input` is a (possibly branch-scoped) tree for the field input dialog.
 */
export type ConceptTreeParams =
  | {mode: 'trunk'; documentId: string; perspective: TaxonomyPerspective}
  | {mode: 'input'; documentId: string; branchId: string | null; perspective: TaxonomyPerspective}

/** Result shape of a live query: mirrors `useListeningQuery`, with `error` normalized to `Error | null`. */
export interface WatchResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

/** A create or remove transaction plan, discriminated by `kind` (see `core/mutations`). */
export type ConceptPlan = CreateConceptPlan | RemoveConceptPlan

/** Return shape of the semantic-recommendations seam (kept identical to today's `useEmbeddingsRecs`). */
export interface SemanticRecommendationsResult {
  conceptRecs: EmbeddingsResult[]
  recsError: string | null
  triggerEmbeddingsSearch: () => void
}
