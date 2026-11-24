// What a run would write: the tagger's result merged into a document's `topic` and
// `topicScores`, under the rules in studio/schemas/objects/topicScore.ts.
//
// Pure, so every rule below can be checked on made-up documents without a query or a Studio.
//
// ── HOW A DOCUMENT'S CURRENT STATE IS READ ───────────────────────────────────────────────
//
//   | in `topic`? | entry in `topicScores`? | read as                                         |
//   | yes         | yes, not excluded       | the tagger's: retagged from scratch, like v5    |
//   | yes         | no                      | an AUTHOR tag: kept, and takes a slot first     |
//   | yes         | yes, excluded           | added back by hand: an AUTHOR tag now           |
//   | no          | yes, not excluded       | REMOVED by the author since the last run:       |
//   |             |                         |   marked excluded, never proposed again         |
//   | no          | yes, excluded           | still excluded                                  |
//
// Only the tagger's own tags are retagged. A tag of the tagger's that no longer earns its slot is
// dropped with its entry, and that is not an exclusion: the tagger let it go, not a person.
//
// ── TWO OF THESE ROWS ARE RECORDED AT THE EDIT, AND READ HERE ONLY AS A BACKSTOP ─────────
//
// "Removed by the author" and "added back by hand" are a person's decisions, so they are
// written when the person makes them (Andy, 2026-11-12): `exclusionPatches` below, applied by
// the Topics field's input (TopicsInput.tsx) as each change to Topics lands in a draft. Until
// then a removal was only inferred at the next run and written when that run was applied, so the
// draft and the run's review disagreed in between: the entry still said "not excluded" while the
// review said "excluded". The rows stay in the table because a change the input never sees, one
// made with no form open, such as a write through the API, still has to be read correctly here.
//
// ── KEYS ARE KEPT ────────────────────────────────────────────────────────────────────────
//
// An item that survives keeps its `_key`, so the draft's history shows what actually changed
// rather than a whole array replaced.

import {tagDocument, type Candidate, type Tag, type TaggerConfig} from './tagger.ts'

export type ConceptRef = {_type: 'reference'; _ref: string; _weak?: boolean}

/** One item of `topic`: a reference with its array key. */
export type TopicRef = ConceptRef & {_key: string}

/** One item of `topicScores`, as the schema stores it. */
export type TopicScoreItem = {
  _key: string
  _type: 'topicScore'
  concept?: ConceptRef
  score?: number
  scoredAt?: string
  excluded?: boolean
}

export type Proposal = {
  /** The new `topic`: author tags first, in their order, then the tagger's in slot order. */
  topic: TopicRef[]
  /** The new `topicScores`: the tagger's tags, then every exclusion. */
  topicScores: TopicScoreItem[]
  /** The tagger's result in slot order, author tags included. */
  tags: Tag[]
  /** Concept ids, for showing the change. */
  authorTags: string[]
  added: string[]
  kept: string[]
  dropped: string[]
  newlyExcluded: string[]
  excluded: string[]
  /** Exclusions for concepts that have left the scheme: removed, since nothing proposes them. */
  pruned: string[]
  /** This run's score for every candidate concept, for showing dropped and excluded ones. */
  scores: Map<string, number>
}

/** Scores are stored to four places, as the research's tag sets were. */
const round = (score: number) => Number(score.toFixed(4))

export function proposeTags(input: {
  topic: (TopicRef | null)[] | null | undefined
  topicScores: (TopicScoreItem | null)[] | null | undefined
  /** Every candidate concept's anchored score for this document (score.ts → scoreDocument). */
  candidates: Candidate[]
  /** Each scheme concept's first broader concept. */
  broaderOf: Map<string, string | null>
  config: Readonly<TaggerConfig>
  /** ISO time, stamped on every entry this run writes. */
  now: string
  /** A fresh array key. */
  newKey: () => string
}): Proposal {
  const topic = (input.topic ?? []).filter((t): t is TopicRef => Boolean(t?._ref))
  const entries = (input.topicScores ?? []).filter((e): e is TopicScoreItem =>
    Boolean(e?.concept?._ref),
  )
  const entryFor = new Map(entries.map((e) => [e.concept!._ref, e]))
  const inTopic = new Set(topic.map((t) => t._ref))
  const scoreOf = new Map(input.candidates.map((c) => [c.concept, c.score]))

  /* The table above, row by row. */
  const authorTags = topic
    .filter((t) => {
      const entry = entryFor.get(t._ref)
      return !entry || entry.excluded
    })
    .map((t) => t._ref)
  const wasTaggers = new Set(
    topic.filter((t) => entryFor.get(t._ref) && !entryFor.get(t._ref)!.excluded).map((t) => t._ref),
  )
  const newlyExcluded = entries
    .filter((e) => !inTopic.has(e.concept!._ref) && !e.excluded)
    .map((e) => e.concept!._ref)
  const stillExcluded = entries
    .filter((e) => !inTopic.has(e.concept!._ref) && e.excluded)
    .map((e) => e.concept!._ref)
  const allExcluded = [...newlyExcluded, ...stillExcluded]

  /* An exclusion only means something for a concept the tagger could propose. */
  const pruned = allExcluded.filter((c) => !scoreOf.has(c))
  const excluded = allExcluded.filter((c) => scoreOf.has(c))
  const out = new Set(excluded)

  const tags = tagDocument(
    input.candidates.filter((c) => !out.has(c.concept)),
    authorTags,
    input.broaderOf,
    input.config,
  )
  const taggers = tags.filter((t) => t.slot !== 'author')

  const keyOfRef = new Map(topic.map((t) => [t._ref, t._key]))
  const ref = (concept: string): TopicRef => ({
    _key: keyOfRef.get(concept) ?? input.newKey(),
    _type: 'reference',
    _ref: concept,
  })
  const entry = (concept: string, score: number, mark?: {excluded: true}): TopicScoreItem => ({
    _key: entryFor.get(concept)?._key ?? input.newKey(),
    _type: 'topicScore',
    concept: {_type: 'reference', _ref: concept, _weak: true},
    score: round(score),
    scoredAt: input.now,
    ...mark,
  })

  const next = new Set(taggers.map((t) => t.concept))
  return {
    topic: [...authorTags.map(ref), ...taggers.map((t) => ref(t.concept))],
    topicScores: [
      ...taggers.map((t) => entry(t.concept, t.score as number)),
      ...excluded.map((c) => entry(c, scoreOf.get(c) as number, {excluded: true})),
    ],
    tags,
    authorTags,
    added: taggers.filter((t) => !inTopic.has(t.concept)).map((t) => t.concept),
    kept: taggers.filter((t) => inTopic.has(t.concept)).map((t) => t.concept),
    dropped: [...wasTaggers].filter((c) => !next.has(c)),
    newlyExcluded: newlyExcluded.filter((c) => scoreOf.has(c)),
    excluded,
    pruned,
    scores: scoreOf,
  }
}

/** A Content Lake patch, in the shape `useDocumentOperation(...).patch.execute` takes. */
export type MutationPatch = {set: Record<string, unknown>} | {unset: string[]}

/**
 * The patches that record one edit to `topic` in `topicScores`: the two rows of the table above
 * that are a person's decisions.
 *
 *   - a concept that LEFT `topic` and has an entry that isn't excluded was the tagger's, and the
 *     author removed it: mark the entry excluded
 *   - a concept that ARRIVED in `topic` and has an excluded entry was added back by hand: drop
 *     the entry, which makes it an author tag
 *
 * Removing an author tag, which has no entry, writes nothing: the tagger never proposed it.
 *
 * @param before  the concepts in `topic` before the edit
 * @param after  the concepts in `topic` after it
 */
export function exclusionPatches(
  before: string[],
  after: string[],
  topicScores: (TopicScoreItem | null)[] | null | undefined,
): MutationPatch[] {
  const was = new Set(before)
  const is = new Set(after)
  const at = (e: TopicScoreItem) => `topicScores[_key=="${e._key}"]`
  return (topicScores ?? []).flatMap((e): MutationPatch[] => {
    const concept = e?.concept?._ref
    if (!e || !concept) return []
    if (was.has(concept) && !is.has(concept) && !e.excluded) {
      return [{set: {[`${at(e)}.excluded`]: true}}]
    }
    if (!was.has(concept) && is.has(concept) && e.excluded) return [{unset: [at(e)]}]
    return []
  })
}
