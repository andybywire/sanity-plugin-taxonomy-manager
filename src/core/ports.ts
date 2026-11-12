import type {ConceptPlan} from './mutations'
import type {ConceptRecommendation, DocumentConcepts, SemanticSearchConfig} from '../types'

/**
 * A create, remove, move or top-concept plan, discriminated by `kind`. Defined
 * with the planners in `core/mutations`, and re-exported here because the port
 * is where callers meet it.
 */
export type {ConceptPlan}

/**
 * #### Taxonomy Data Port
 * The single internal seam for everything that touches Sanity Studio or the
 * network: the live concept-tree query, concept-mutation transactions, and
 * semantic term recommendations. Components and mutation hooks talk to this
 * interface instead of `useListeningQuery`/`useClient` directly, so the render
 * tree can be exercised against an in-memory fake (`test/FakeDataPort`) and the
 * implementation can be swapped later (e.g. the App SDK) without touching
 * components.
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
  /** Which of the given concepts exist as published documents (`published` perspective). */
  useWatchPublishedConcepts(params: PublishedConceptsParams): WatchResult<ReadonlySet<string>>
  /** How many resources are tagged with each of the given concepts (governance view). */
  useWatchConceptUsage(params: ConceptUsageParams): WatchResult<ReadonlyMap<string, number>>
  /** Replay a pure create/remove/move plan (`core/mutations`) onto the Studio client. */
  useApplyConceptPlan(): (plan: ConceptPlan) => Promise<void>
  /** One-shot search for concepts outside a scheme, for the insert picker. */
  useSearchConcepts(): (params: ConceptSearchParams) => Promise<ConceptSearchResult[]>
  /** Semantic term recommendations for the input components (GROQ `text::semanticSimilarity()`). */
  useSemanticRecommendations(config?: SemanticSearchConfig): SemanticRecommendationsResult
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

/**
 * Which concepts to test for a published version.
 *
 * The caller passes the ids the tree is showing, so the query and its listener
 * are scoped to what is on screen. An empty list is the off switch: the query
 * matches nothing and the listener never fires, which is how the publication
 * markers are turned off in an input tree or a release perspective — there is
 * no `enabled` flag because `useListeningQuery` cannot be called conditionally.
 *
 * Sort the ids before passing them. The list is a query parameter, so an
 * unstable order would resubscribe the listener on every tree update.
 */
export type PublishedConceptsParams = {
  /** Published concept ids, sorted. Empty means "ask nothing". */
  ids: readonly string[]
}

/**
 * Which concepts to count tagged resources for, and under which perspective.
 *
 * The ids are the ones the tree is showing, exactly as
 * {@link PublishedConceptsParams} works, and an empty list is the same off
 * switch: the query matches nothing and the listener never fires. Sort them —
 * the list is a query parameter, so an unstable order would resubscribe the
 * listener on every tree update.
 *
 * Unlike the publication markers, which are pinned to `published` because that
 * is the question they ask, usage takes the perspective it is given. It is the
 * one the tree is rendering, which is the rule ADR 0005 drew from the insert
 * picker: any query the plugin adds takes its perspective from the same place
 * the tree does rather than choosing one. A count shown beside a tree row has
 * to be counting the same world that row came from.
 */
export type ConceptUsageParams = {
  /** Concept ids, sorted. Empty means "ask nothing". */
  ids: readonly string[]
  /** The perspective the tree is rendering. */
  perspective: TaxonomyPerspective
}

/** Result shape of a live query: mirrors `useListeningQuery`, with `error` normalized to `Error | null`. */
export interface WatchResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

/**
 * What the insert picker asks for. A one-shot fetch rather than a live query:
 * a picker wants the answer to what has been typed, not a subscription.
 */
export type ConceptSearchParams = {
  /** Published ids already in the scheme, which the search excludes. */
  excludeIds: readonly string[]
  /** The typed text, passed to GROQ `match`. */
  searchQuery: string
  /**
   * The perspective to search under — the same one the tree is rendering.
   *
   * Both halves of the picker's question have to be asked in one perspective.
   * The exclusion list comes from the tree, so pinning the candidate list to
   * `drafts` while the tree renders a release asks them in two: inside a
   * release the picker then offered concepts that exist only as drafts and are
   * invisible in that release, and filing one pulled it in, seeded from the
   * draft, for the release to publish.
   *
   * Ids come back normalized to published form under a release just as they do
   * under drafts, so the exclusion list needs no reconciling either way.
   */
  perspective: TaxonomyPerspective
  /**
   * False only when picking a top concept, which SKOS says may not hold a
   * broader term inside its own scheme. A broader term in another scheme is no
   * bar. Defaults to true wherever it is left out.
   */
  allowBroaderInScheme?: boolean
}

/** One candidate in the insert picker. */
export type ConceptSearchResult = {
  id: string
  _originalId?: string
  prefLabel: string
  /**
   * The concept's broader references, so the caller can work out where it will
   * land before the listener says (see `inSchemeBroaderRef`).
   */
  broaderRefs?: string[]
}

/** Return shape of the semantic-recommendations seam. */
export interface SemanticRecommendationsResult {
  conceptRecs: ConceptRecommendation[]
  recsError: string | null
  /** Run the search, scoping recommendations to the given scheme; a no-op without a `schemeId`. */
  triggerSearch: (schemeId?: string) => void
}
