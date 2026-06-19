import type {
  ConceptPlan,
  ConceptTreeParams,
  SemanticRecommendationsResult,
  TaxonomyDataPort,
  WatchResult,
} from '../core/ports'
import type {ConceptRecommendation, DocumentConcepts} from '../types'

/** Fixtures + canned responses for a {@link createFakeDataPort}. */
export interface FakeDataPortConfig {
  tree?: DocumentConcepts | null
  loading?: boolean
  error?: Error | null
  recommendations?: ConceptRecommendation[]
  recsError?: string | null
}

/** A {@link TaxonomyDataPort} that also exposes recorded interactions for assertions. */
export interface FakeDataPort extends TaxonomyDataPort {
  /** Plans passed to the applyConceptPlan function, in call order. */
  readonly appliedPlans: ConceptPlan[]
  /** Number of `triggerSearch()` calls. */
  triggeredSearches: number
  /** Params from the most recent `useWatchTree` call. */
  lastWatchParams: ConceptTreeParams | null
}

/**
 * In-memory `TaxonomyDataPort` for component/tree tests. Returns the configured
 * fixtures synchronously (no Studio, no network) and records mutations and
 * search triggers for assertions. The hook members call no React hooks, so they
 * return stable references and never suspend. Provide via:
 * `<TaxonomyPortProvider port={createFakeDataPort({tree})}>`.
 */
export function createFakeDataPort(config: FakeDataPortConfig = {}): FakeDataPort {
  const watchResult: WatchResult<DocumentConcepts> = {
    data: config.tree ?? null,
    loading: config.loading ?? false,
    error: config.error ?? null,
  }
  const recsResult: SemanticRecommendationsResult = {
    conceptRecs: config.recommendations ?? [],
    recsError: config.recsError ?? null,
    triggerSearch: () => {
      fake.triggeredSearches += 1
    },
  }
  const apply = (plan: ConceptPlan): Promise<void> => {
    fake.appliedPlans.push(plan)
    return Promise.resolve()
  }
  const fake: FakeDataPort = {
    appliedPlans: [],
    triggeredSearches: 0,
    lastWatchParams: null,
    useWatchTree: (params: ConceptTreeParams) => {
      fake.lastWatchParams = params
      return watchResult
    },
    useApplyConceptPlan: () => apply,
    useSemanticRecommendations: () => recsResult,
  }
  return fake
}
