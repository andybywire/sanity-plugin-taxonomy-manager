// Scoring one document against every Topic concept, for the "Suggest topics" action.
//
// ── THE SAME QUERY THE RESEARCH MEASURED, ONE DOCUMENT AT A TIME ───────────────────────────
//
// v5, the configuration five rounds of M3 evaluation settled on, scored each concept with ONE
// semantic query built from its label, definition, scope note and example: the `combined`
// recipe in docs/recommendations-research/score-spike.mjs. `queryText` below builds that text
// the same way, and was checked against the text v5's matrix saved for all 68 concepts.
//
// The research query scored every document at once; this one scores only the document being
// tagged and the concept's own document, which anchors the scale. That changes nothing: a
// document's raw score does not depend on what else the query matches. Measured 2026-11-12, the
// Cognitive Sciences Reading List against Cognition scored 7.885244 in the full query, in the
// narrowed one and in v5's matrix, and the concept's own document 9.654434 in all three.
//
// So tagging a document costs one semantic query per concept, 68 today, against the
// organization's monthly semantic search quota. Retagging every document costs the same 68, if
// each query scores the whole corpus, which is why corpus retags stay a script.
//
// ── WHY THE DRAFT IS SCORED WHEN THERE IS ONE ───────────────────────────────────────────────
//
// Drafts are embedded in their own right (checked in the lab, 2026-11-06), so a piece can be
// tagged before its first publish and published once. An embedding lags its document by up to a
// minute or so, though, so a run straight after an edit scores the text as it was.

import {anchored, type Candidate, type TaggerConfig} from './tagger.ts'

/** The Topic scheme, by the Taxonomy Manager's `schemeId`: the id the `topic` fields filter on. */
export const TOPIC_SCHEME_ID = '2e73674'

/** The fields joined into each concept's query, in order: the research's `combined` recipe. */
export const QUERY_FIELDS = ['prefLabel', 'definition', 'scopeNote', 'example'] as const

export type TaggerConcept = {
  _id: string
  prefLabel: string | null
  definition: string | null
  scopeNote: string | null
  example: string | null
  /** The first broader concept only, as the research tagger and ranker both read it. */
  parent: string | null
}

/**
 * Runs a GROQ query. The Studio passes its own client; checks outside the Studio pass a fetch
 * against the HTTP API. `raw` sees drafts beside published documents, which scoring needs.
 */
export type QueryFn = <T>(
  query: string,
  params: Record<string, unknown>,
  perspective: 'published' | 'raw',
) => Promise<T>

/** One concept's query text: the non-empty fields, joined by blank lines. */
export const queryText = (c: TaggerConcept) =>
  QUERY_FIELDS.map((f) => c[f])
    .filter((s): s is string => typeof s === 'string' && s.trim() !== '')
    .join('\n\n')

const CONCEPTS_QUERY = `*[_type == "skosConceptScheme" && schemeId == $schemeId][0]{
  "concepts": concepts[]->{_id, prefLabel, definition, scopeNote, example, "parent": broader[0]._ref}
}.concepts`

/**
 * The Topic scheme's concepts, published, below its top concepts: the tagger's candidates. Top
 * concepts are never candidates (plan.md → Tagger).
 *
 * THROWS if any concept lacks a definition or an example. A concept scored on less text sits on
 * a looser scale than the rest, so the same bar would mean something different for it: the
 * research measured exactly that when example-only queries let 32% of pairs through against
 * 14% for the combined one. score-spike.mjs refuses the same way.
 */
export async function fetchConcepts(query: QueryFn): Promise<TaggerConcept[]> {
  const concepts = await query<(TaggerConcept | null)[] | null>(
    CONCEPTS_QUERY,
    {schemeId: TOPIC_SCHEME_ID},
    'published',
  )
  const all = (concepts ?? []).filter((c): c is TaggerConcept => Boolean(c?._id))
  if (!all.length) throw new Error('The Topic scheme has no concepts, or was not found.')
  const unfilled = all.filter((c) => !c.definition?.trim() || !c.example?.trim())
  if (unfilled.length) {
    throw new Error(
      'Every Topic concept needs a definition and an example before the tagger can run. ' +
        `Missing on: ${unfilled.map((c) => c.prefLabel ?? c._id).join(', ')}.`,
    )
  }
  return all
}

const SCORE_QUERY = `*[_id in [$doc, $self]] | score(text::semanticSimilarity($q)) {_id, _score}`

/** How many concept queries run at once: fast enough, and gentle on the API. */
const CONCURRENCY = 6

/**
 * Scores one document against every concept, on the anchored scale.
 *
 * @param docId  the id to score: `drafts.…` for a draft, the bare id for the published version
 * @param onProgress  called after each concept, with the count done
 * @returns one candidate per concept, in the concepts' order
 */
export async function scoreDocument(
  query: QueryFn,
  docId: string,
  concepts: TaggerConcept[],
  config: Readonly<TaggerConfig>,
  onProgress?: (done: number, total: number) => void,
): Promise<Candidate[]> {
  const results: Candidate[] = new Array(concepts.length)
  let next = 0
  let done = 0
  /* Set by the first failure, so the other workers stop instead of spending quota on a run
     that has already failed. */
  let failed = false

  const worker = async () => {
    while (next < concepts.length && !failed) {
      const i = next++
      const c = concepts[i]
      const rows = await query<{_id: string; _score: number}[]>(
        SCORE_QUERY,
        {doc: docId, self: c._id, q: queryText(c)},
        'raw',
      )
      const raw = rows.find((r) => r._id === docId)?._score
      const self = rows.find((r) => r._id === c._id)?._score
      if (typeof raw !== 'number') {
        throw new Error(
          'This document has no embedding yet. Embeddings follow an edit by up to a minute or ' +
            'so: try again shortly.',
        )
      }
      if (typeof self !== 'number') {
        throw new Error(
          `The concept "${c.prefLabel ?? c._id}" has no embedding yet, so its scores can't be ` +
            'anchored. Try again shortly.',
        )
      }
      results[i] = {concept: c._id, score: anchored(raw, self, config.floor)}
      onProgress?.(++done, concepts.length)
    }
  }

  const guarded = () =>
    worker().catch((error) => {
      failed = true
      throw error
    })
  await Promise.all(Array.from({length: Math.min(CONCURRENCY, concepts.length)}, guarded))
  return results
}
