import {defineType, defineField, type FieldsetDefinition} from 'sanity'
import {uniqueConcepts} from '../validation'

/**
 * One concept's score for one document, written by the tagger (studio/tagger/tagger.ts).
 * Drafted by Claude and approved by Andy (2026-11-12). Not deployed until promotion.
 *
 * ── A PARALLEL FIELD, SO `topic` STAYS WHAT IT WAS ───────────────────────────────────────
 *
 * Decided 2026-10-22 (docs/recommendations-research/plan.md → Decisions): `topic` stays a plain
 * array of references, which every query, facet and feed already reads, and the scores live
 * beside it in `topicScores`. So nothing that reads topics today has to change, and a document
 * without scores, which is every document until the tagger runs, still works everywhere.
 *
 * ── ONE ENTRY CAN MEAN THREE THINGS, AND ITS ABSENCE A FOURTH ────────────────────────────
 *
 *   | in `topic`? | entry here?           | meaning                                           |
 *   | yes         | yes                   | the tagger proposed it, and it stayed             |
 *   | yes         | no                    | an AUTHOR tag: added by hand, never bumped        |
 *   | no          | yes, `excluded: true` | the tagger proposed it and the author removed it  |
 *   | no          | no                    | not a tag                                         |
 *
 * The absence rule for author tags is the one decided on 10-22. `excluded` is new (Andy,
 * 2026-11-12): without it, the next run would propose a removed tag again, so a person's "no"
 * would last only until the tagger ran. The AUTHOR never sets it, because the field is read-only.
 * Removing the tag sets it: the Topics field's input (studio/tagger/TopicsInput.tsx) marks the
 * entry as the removal lands, and adding the concept back drops the entry, which makes it an
 * author tag. The rules are in studio/tagger/propose.ts, which also reads a change made with no
 * form open the same way at the next run.
 *
 * ── WHAT THE SCORE IS ────────────────────────────────────────────────────────────────────
 *
 * The tagger's anchored score: (raw − floor) / (self − floor), where `self` is the concept's
 * own document in the same semantic query. 0 is as unrelated as anything in the corpus, 1 is
 * the concept's own words, and a tag needs 0.45 to earn a slot. A raw Sanity `_score` can't be
 * stored usefully here: it can't be compared across queries, and every concept is its own query.
 *
 * The ranker reads it for one thing: breaking ties by tag strength (web/src/lib/related.ts →
 * TIES), the weaker of two documents' scores on each concept they share. AN AUTHOR TAG HAS NO
 * ENTRY, SO IT ADDS NOTHING TO THAT STRENGTH. That follows from the absence rule, and it is the
 * rule's one cost; see the handover for the alternative.
 *
 * ── WHY THE REFERENCE IS WEAK ────────────────────────────────────────────────────────────
 *
 * A score is derived data. A strong reference would stop a concept from being deleted or merged
 * while any document held a score for it, including an `excluded` score for a concept nobody
 * tagged. `topic`'s references stay strong, which is the right guard: a concept in use as a tag
 * should not disappear silently. A weak reference left dangling by a deleted concept is pruned
 * by the next run.
 *
 * ── WHAT THE RESEARCH STORED AND THIS DOESN'T ────────────────────────────────────────────
 *
 * The 10-22 shape had a `round`, which named the research round that produced a score. It has no
 * meaning outside the experiment, and `scoredAt` dates a score well enough to find the tagger
 * configuration that made it in git history.
 */
export default defineType({
  name: 'topicScore',
  type: 'object',
  title: 'Topic score',
  fields: [
    defineField({
      name: 'concept',
      title: 'Concept',
      type: 'reference',
      to: [{type: 'skosConcept'}],
      weak: true,
    }),
    defineField({
      name: 'score',
      title: 'Score',
      type: 'number',
      description: 'On the anchored scale: 0 unrelated, 1 the concept itself. A tag needs 0.45.',
    }),
    defineField({
      name: 'scoredAt',
      title: 'Scored',
      type: 'datetime',
    }),
    defineField({
      name: 'excluded',
      title: 'Excluded',
      type: 'boolean',
      description: 'Proposed by the tagger and removed by the author, so it is not proposed again.',
    }),
  ],
  preview: {
    select: {title: 'concept.prefLabel', score: 'score', excluded: 'excluded'},
    prepare: ({title, score, excluded}) => ({
      title: title ?? 'A deleted concept',
      subtitle: [typeof score === 'number' ? score.toFixed(3) : 'no score', excluded && 'excluded']
        .filter(Boolean)
        .join(' · '),
    }),
  },
})

/**
 * The fieldset that holds `topicScores`, collapsed and placed after Topics, on the four types
 * the tagger tags: article, caseStudy, note and presentation.
 *
 * "Read-only and collapsed" was decided on 2026-10-26, and an array field cannot collapse on its
 * own: `collapsible` is an option of objects and fieldsets only. So the field sits in a fieldset
 * of one. Each type declares it in `fieldsets`, the field names it, and both come from here so
 * the four types can't drift apart.
 */
export const topicScoresFieldset: FieldsetDefinition = {
  name: 'tagger',
  title: 'Tagger',
  options: {collapsible: true, collapsed: true},
}

/** The `topicScores` field itself, for the four types that carry `topic`. */
export const topicScoresField = () =>
  defineField({
    name: 'topicScores',
    title: 'Topic scores',
    type: 'array',
    of: [{type: 'topicScore'}],
    fieldset: topicScoresFieldset.name,
    readOnly: true,
    description:
      'Written by the tagger, never by hand. A topic with no score here is one you added yourself.',
    validation: (rule) => rule.custom(uniqueConcepts),
  })
