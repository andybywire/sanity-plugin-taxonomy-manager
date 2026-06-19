import {getPublishedId, type DocumentId} from '@sanity/id-utils'

import type {ConceptRecommendation} from '../types'

/**
 * #### Semantic Recommendations (pure core)
 * The decision-bearing logic for the semantic term-recommendation seam: the GROQ
 * query, the query-text assembly + validation, result mapping, and error
 * messaging. The Studio adapter (`useSemanticRecommendations`) supplies the form
 * values, runs the query, and owns React state; everything here is pure so it can
 * be unit-tested without Studio or the network.
 *
 * Replaces the deprecated Embeddings Index API (`/embeddings-index/query/…`,
 * `text::embedding()`) with dataset embeddings queried through
 * `text::semanticSimilarity()` — no named index, scored in GROQ.
 */

/**
 * GROQ for the recommendations query. Every `skosConcept` is scored by semantic
 * similarity to `$query`; the top `$maxResults` come back as `{conceptId, score}`,
 * most-relevant first. `text::semanticSimilarity()` is only valid inside `score()`,
 * and the dataset must have embeddings enabled or the query errors (surfaced via
 * {@link recommendationsErrorMessage}). Filtering to `skosConcept` first keeps the
 * candidate set small, mirroring the old index's concept-only scope.
 */
export const recommendationsQuery = (): string =>
  `*[_type == "skosConcept"] | score(text::semanticSimilarity($query)) | order(_score desc) [0...$maxResults] {
    "conceptId": _id,
    "score": _score
  }`

/** A document field name paired with its current value, read from the edited document. */
export interface RecommendationField {
  name: string
  value: unknown
}

/**
 * Concatenate the referenced fields' values into the semantic-search query text.
 * Every field must hold a non-empty string; otherwise this throws with a message
 * naming the empty field(s), which the adapter surfaces as `recsError` rather than
 * searching against partial input. The messages are preserved verbatim from the
 * pre-migration embeddings hook.
 */
export function assembleQueryText(fields: RecommendationField[]): string {
  const values: string[] = []
  const emptyFields: string[] = []
  for (const {name, value} of fields) {
    if (typeof value === 'string' && value.trim() !== '') {
      values.push(value)
    } else {
      emptyFields.push(name)
    }
  }
  if (emptyFields.length === 1) {
    throw new Error(`Please fill out the ${emptyFields[0]} field to enable match scores.`)
  }
  if (emptyFields.length > 1) {
    throw new Error(
      `The following fields must be filled out to enable match scores: ${emptyFields.join(', ')}`
    )
  }
  return values.join(' ')
}

/** A raw row from {@link recommendationsQuery}, before id normalization. */
export interface RecommendationRow {
  conceptId: string
  score: number
}

/**
 * Map raw query rows to {@link ConceptRecommendation}s, normalizing each concept id
 * to its published form so the scores line up with `annotateScores`, which keys the
 * tree by published id. Rows missing a string id or numeric score are dropped.
 */
export function toConceptRecommendations(
  rows: readonly RecommendationRow[] | null | undefined
): ConceptRecommendation[] {
  if (!rows) return []
  const recs: ConceptRecommendation[] = []
  for (const row of rows) {
    if (!row || typeof row.conceptId !== 'string' || row.conceptId === '') continue
    if (typeof row.score !== 'number') continue
    recs.push({conceptId: getPublishedId(row.conceptId as DocumentId), score: row.score})
  }
  return recs
}

/** Friendly message shown when a dataset has no embeddings enabled. */
const EMBEDDINGS_DISABLED_MESSAGE = "Semantic recommendations aren't enabled for this dataset."
/** Fallback for any other recommendations failure. */
const GENERIC_RECS_ERROR_MESSAGE = 'Unable to load semantic recommendations.'

/**
 * Map a failed recommendations fetch to a friendly `recsError` message. A dataset
 * without embeddings is the expected failure — `text::semanticSimilarity()` errors
 * there — so an embeddings-related error becomes a clear setup hint; anything else
 * falls back to a generic message. Either way the tree still renders, only without
 * scores.
 *
 * The embeddings-disabled detection matches on the error text; confirm it against
 * the live API error in a `pnpm dev` pass and widen the match if the wording differs.
 */
export function recommendationsErrorMessage(error: unknown): string {
  const text = error instanceof Error ? error.message : typeof error === 'string' ? error : ''
  return /embedding/i.test(text) ? EMBEDDINGS_DISABLED_MESSAGE : GENERIC_RECS_ERROR_MESSAGE
}
