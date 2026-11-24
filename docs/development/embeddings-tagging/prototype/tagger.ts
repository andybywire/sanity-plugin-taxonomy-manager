// The tagger: a concept × document score matrix in, a tag set per document out.
//
// ── ONE TAGGER, TWO CONSUMERS ───────────────────────────────────────────────────────────────
//
// It lives in the Studio because the Studio's "Suggest topics" action runs it (Andy,
// 2026-11-06), and the recommendations research imports it from here through a one-line
// re-export at docs/recommendations-research/tagger.mjs. So the tagger in production is the
// one that five rounds of M3 evaluation measured, not a copy that could drift from it. It moved
// here from that file on 2026-11-06, and every research tag set was re-run through it and came
// back identical.
//
// It is pure, with no I/O and nothing run on import. Plain Node runs it under type stripping,
// as it runs web/src/lib/related.ts, so it uses only syntax that strips cleanly: annotations
// and type declarations, no enums, namespaces or parameter properties.
//
// docs/recommendations-research/plan.md → Tagger is the spec; in brief:
//
//   - Scores go on the anchored scale, (raw − floor) / (self − floor), where `self` is the
//     concept's own document scored in the same query. 0 is as unrelated as anything in the
//     corpus, 1 is the concept's own words.
//   - Slots run in band order. Round 0 has three at ≥ 0.45, then three more at ≥ 0.54.
//   - Author tags take slots from the front and are never bumped. The research rounds had none:
//     each retagged from scratch.
//   - A document that earns no tag still gets its single best concept.
//   - No tag sits beside its own broader concept, and the more specific one wins.
//
// ── WHAT "BOTH QUALIFY" MEANS ───────────────────────────────────────────────────────────────
//
// The spec says that when a concept and its broader both qualify, the more specific one wins.
// Here, qualifying means EARNING A SLOT on score, not merely clearing 0.45. Slots fill in score
// order; if a concept and its broader both earned one, the broader gives its slot up and the
// next candidate in line takes it, under the same rules. So a narrow concept that would not
// have made the cut on its own score cannot push out a broader one that did.
//
// The other reading, where any narrower concept clearing 0.45 displaces its broader, lets a
// weak child evict a strong parent from a document that was full anyway.
//
// ── NOT BUILT YET, ON PURPOSE ───────────────────────────────────────────────────────────────
//
//   - The RULE OF N (`ruleOfN`), off in round 0. A non-null value throws rather than being
//     silently ignored.
//   - The INCREMENTAL BUMP: "a new candidate takes a free slot, or bumps the lowest auto tag it
//     outscores." Every run retags from scratch, which is all this does. The two differ when a
//     changed concept's score DROPS, which a bump never removes (plan.md → Open questions).

/** One band of slots: up to `count` tags, each scoring at least `min`. */
export type Band = {count: number; min: number}

/** How two or more anchored scores for one concept become one. See COMBINE. */
export type CombineName = 'mean' | 'max'

export type TaggerConfig = {
  floor: number
  bands: readonly Band[]
  minimum: number
  ruleOfN: number | null
  combine?: CombineName
}

/** One concept's anchored score for one document. */
export type Candidate = {concept: string; score: number}

/**
 * One tag, in slot order. `score` is null only for an author tag the matrix did not score.
 * `slot` is 'author', 'band 1', 'band 2' or 'minimum'.
 */
export type Tag = {concept: string; score: number | null; slot: string}

/**
 * The round-0 configuration (Andy, 2026-10-26). The floor is frozen from the score spike. It is
 * also v5's, the configuration measured last, since no round changed the bands.
 */
export const ROUND_0: Readonly<TaggerConfig> = Object.freeze({
  floor: 4.9,
  bands: [
    {count: 3, min: 0.45},
    {count: 3, min: 0.54},
  ],
  minimum: 1,
  ruleOfN: null,
})

/** A raw `_score` on the anchored scale. */
export const anchored = (raw: number, self: number, floor: number) => (raw - floor) / (self - floor)

/**
 * Tag one document.
 *
 * @param candidates  every candidate concept's anchored score for this document. Top concepts
 *   are never candidates, so they are not in the list.
 * @param authorTags  concept ids the author set. They take slots first.
 * @param broaderOf  each concept's broader concept
 * @returns the tags in slot order
 */
export function tagDocument(
  candidates: Candidate[],
  authorTags: string[],
  broaderOf: Map<string, string | null>,
  config: Readonly<TaggerConfig>,
): Tag[] {
  if (config.ruleOfN != null) {
    throw new Error('[tagger] the rule of N is not built yet; see the note at the top of tagger.ts')
  }

  /* One threshold per slot, in band order: [0.45, 0.45, 0.45, 0.54, 0.54, 0.54] in round 0.
     They never fall from one slot to the next, which is what lets the fill stop early. */
  const slots = config.bands.flatMap((band, i) =>
    Array.from({length: band.count}, () => ({min: band.min, name: `band ${i + 1}`})),
  )
  for (let i = 1; i < slots.length; i++) {
    if (slots[i].min < slots[i - 1].min) throw new Error('[tagger] band minimums must not fall')
  }

  const beside = (a: string, b: string) => broaderOf.get(a) === b || broaderOf.get(b) === a
  const score = new Map(candidates.map((c) => [c.concept, c.score]))
  const authors: Tag[] = authorTags.map((concept) => ({
    concept,
    score: score.get(concept) ?? null,
    slot: 'author',
  }))

  /* An auto tag may not sit beside an author tag, and author tags are never removed, so any
     candidate beside one is out before the fill starts. */
  const ranked = candidates
    .filter((c) => !authorTags.includes(c.concept))
    .filter((c) => !authorTags.some((a) => beside(a, c.concept)))
    .sort((a, b) => b.score - a.score)

  /* Fill by score; if a concept and its broader both earned a slot, drop the broader and fill
     again. Each pass excludes at least one more concept, so this ends. */
  const lost = new Set<string>()
  let auto: Tag[]
  for (;;) {
    auto = []
    for (const c of ranked) {
      if (lost.has(c.concept)) continue
      const slot = slots[authors.length + auto.length]
      /* Scores fall and thresholds never do, so the first miss ends the fill. */
      if (!slot || c.score < slot.min) break
      auto.push({...c, slot: slot.name})
    }
    const broader = auto.filter((t) => auto.some((u) => broaderOf.get(u.concept) === t.concept))
    if (!broader.length) break
    for (const t of broader) lost.add(t.concept)
  }

  const tags = [...authors, ...auto]

  /* The minimum: top up from the best of what is left, still never beside another tag. With
     round 0's minimum of one, this only ever gives an untagged document its best concept. */
  for (const c of ranked) {
    if (tags.length >= config.minimum) break
    if (tags.some((t) => t.concept === c.concept || beside(t.concept, c.concept))) continue
    tags.push({...c, slot: 'minimum'})
  }

  return tags
}

/**
 * How two or more anchored scores for one concept and one document become one (revision 2, Andy,
 * 2026-11-05). Each comes from its own query, anchored to that query's own self-match, which is
 * what puts them on one scale: raw `_score`s from different queries can't be compared.
 *
 *   mean  a piece has to match every query reasonably well, which leans toward precision
 *   max   a piece has to match any one of them, which leans toward recall, and adds up the
 *         false matches of every query
 *
 * One rule for every concept, set in the configuration, never chosen per concept: picking the
 * better query concept by concept would be a metadata application profile hidden in this code.
 * Neither is in use: v2 onward score one combined query per concept. They stay so the research's
 * v2-mean and v2-max candidates remain reproducible.
 */
export const COMBINE: Readonly<Record<CombineName, (xs: number[]) => number>> = Object.freeze({
  mean: (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length,
  max: (xs: number[]) => Math.max(...xs),
})

/** One query's scores for one concept: its own document's score, and every document's. */
export type ConceptQuery = {self: number; scores: Record<string, number>}

/**
 * A score matrix in score-spike.mjs's format. A concept carries either one query's `self` and
 * `scores`, or, for a combined run, `queries`: one `{self, scores}` per query, combined by
 * `config.combine`. tagset.mjs builds the second shape from two matrices.
 */
export type ScoreMatrix = {
  docs: {_id: string}[]
  concepts: {
    _id: string
    parent: string | null
    self?: number | null
    scores?: Record<string, number>
    queries?: ConceptQuery[]
  }[]
}

/**
 * Tag every document in a score matrix.
 *
 * @param authorTags  concept ids by document id; none in the research rounds
 * @returns each document's tags, by document id
 */
export function tagCorpus(
  matrix: ScoreMatrix,
  config: Readonly<TaggerConfig>,
  authorTags: Map<string, string[]> = new Map(),
): Map<string, Tag[]> {
  const broaderOf = new Map(matrix.concepts.map((c) => [c._id, c.parent]))
  const combine = config.combine ? COMBINE[config.combine] : null
  if (config.combine && !combine) throw new Error(`[tagger] unknown combine "${config.combine}"`)
  return new Map(
    matrix.docs.map((d) => {
      const candidates = matrix.concepts.map((c) => {
        /* A concept with no self-match can't be anchored, and every matrix so far has had one
           for every concept; score-spike.mjs reports any that don't. */
        const queries: ConceptQuery[] =
          c.queries ??
          (typeof c.self === 'number' && c.scores ? [{self: c.self, scores: c.scores}] : [])
        if (!queries.length) throw new Error(`[tagger] ${c._id} has no self-match to anchor to`)
        if (queries.length > 1 && !combine) {
          throw new Error(`[tagger] ${c._id} has ${queries.length} queries and no config.combine`)
        }
        const scores = queries.map((q) => {
          const raw = q.scores[d._id]
          if (typeof raw !== 'number') {
            throw new Error(`[tagger] the matrix has no score for ${d._id} against ${c._id}`)
          }
          return anchored(raw, q.self, config.floor)
        })
        return {concept: c._id, score: queries.length > 1 && combine ? combine(scores) : scores[0]}
      })
      return [d._id, tagDocument(candidates, authorTags.get(d._id) ?? [], broaderOf, config)]
    }),
  )
}
