# Embeddings-assisted tagging: the starting document

*Written 2026-11-19 in `andybywire/andyfitzgeraldconsulting` as the kickoff for the third of
three work streams, and moved here on 2026-11-24 with the research it draws on, so this work
can proceed without the site repository. The first two streams are done on the site: its
dataset was rebuilt with the research's taxonomy and tags (2026-11-21), and its related-content
ranker was rebuilt to read them (2026-11-23), without tag scores until this stream supplies them.
Until this lands, the site uses the plugin as it is today, with no assisted tagging.*

## What's in this folder

| Path | What |
|---|---|
| `README.md` | This document: the goal, what the research established, the design to start from, open questions |
| `kickoff-prompt.md` | The prompt that starts the stream's first session: what to read, the ground rules, and what that session delivers. Paste it whole |
| `research/` | The research's own record, copied unchanged: `plan.md` (decisions, phases, specs), `report-spike.md` (how scores behave), `how.md` and `value-add.md` (the article material), `what-goes-where.md`, `related-algorithm.md` |
| `prototype/` | The site's tagger, for reference only: nothing here builds or is linted |
| `evidence/` | The v5 tag set and the score matrix it was selected from: the golden reference |

Each copy names the site commit it came from. Links inside the `research/` files point into the
site repository, where the whole research folder stays in git history at that commit.

## What this stream is for

Bring tagging assisted by Sanity's dataset embeddings into the Taxonomy Manager, at three levels,
in one consistent, user-friendly design (Andy, 2026-11-19):

| Level | When | What the plugin does |
|---|---|---|
| **Scheme** | A new scheme, or a first pass over existing content | Tags the whole collection with the scheme's concepts |
| **Concept** | A concept is added or its text changes | Finds every resource it describes, and shows what each would gain or lose |
| **Resource** | A new or edited article, note or presentation | Suggests concepts from the scheme |

Two constraints run through every decision:
- **Reproducible for anyone using the plugin,** not tuned to one site's numbers.
- **No new friction:** a user's document types should need nothing beyond the concept reference
  field they already have.

It takes as many sessions as it takes. Nothing on the site waits for it.

## What the research established

A month-long study on the consulting site's 73 pieces asked what a taxonomy contributes to
related content when embeddings are also available. It closed on 2026-11-06. Its record is
`research/plan.md`; `research/related-algorithm.md` draws the algorithm, and
`research/what-goes-where.md` sorts every part between the plugin, a companion, an article and
the site.

What matters here:

- **The concept is the query.** One semantic search per concept, built from its label,
  definition, scope note and example, scores every document at once. Five rounds of evaluation
  validated this direction, against embeddings alone and against hand tags.
- **The anchored scale** makes scores comparable across concepts: (raw − floor) ÷ (self − floor).
  `self` is the concept's own document in the same query; the floor (4.9 here) was frozen from a
  full first pass. Sanity's raw `_score` can't be compared across queries
  (`research/report-spike.md`). **The floor and the bands were measured on one dataset's
  embeddings index,** and an index rebuilt from the same content agreed with it closely but not
  exactly: rank correlation 0.95 to 0.97, with long documents moving most. Any other dataset
  calibrates from its own matrix.
- **Selection:** up to 3 tags at ≥ 0.45, then 3 more at ≥ 0.54; never a concept beside its own
  parent, the more specific winning; at least one tag; author tags kept and never bumped; a tag
  the author removed is never proposed again. The values are that site's; the mechanism is
  general.
- **Concept text is working text.** Genus–differentia definitions and short archetype examples,
  about 400 characters, set outside the corpus, moved results more than any ranking rule did.
  No concept can be tagged with until it has both. There are no per-concept rules: anything
  that varies by concept belongs in the vocabulary, not in code.
- **Cost.** One search is one read of the organization's `embeddings-reads` metric. The Free
  plan's monthly quota is 1,000, counted but not enforced in real time (2026-11-17). Tagging the
  whole corpus costs one search per concept; so does tagging a single document, done the same
  way.
- **The reverse direction** queries from the document: section-aligned chunks of at most 2,000
  characters, since a query is read only to about 2,500. It is good for recall and unreliable
  for scores. Reverse scores alone gave v5's exact tags on 9 of 37 documents. As a shortlist,
  the top 15 concepts by the mean of each document's best two chunks, then scored forward,
  reproduced v5's tags on 68 of 73 (72 at 20). The offset between the two directions follows
  the document's own self-match, a possible correction not yet built (`research/plan.md` → "The
  reverse direction").
- **Narrowing a forward query to one document changes no score,** and **drafts are embedded in
  their own right,** so a piece can be tagged before its first publish.

## The prototype, and what it taught

`prototype/` holds the site's version: the pure tagger, scoring, the merge into `topic` with
author tags and exclusions, a "Suggest topics" document action, and an input that records a
removal. It ran in the site's lab Studio only, and never reached production. Lessons for the
plugin:

- **Record a person's decision when it's made.** The first version inferred exclusions at the next
  run, so the draft and the review disagreed. The site's fix watches the value of Topics from
  outside, because the plugin's browse dialog writes with its own client. **Inside the plugin,
  the input and the dialog are the plugin's own,** so it can write the mark in the same
  transaction as the removal.
- **Per-document tagging spends quota fast.** Five test runs cost 340 searches in a day. Hence
  the reverse shortlist, and batching.
- **The plugin's current recommendations query the reverse way, uncalibrated** (ADR 0002). That's
  one query instead of 68, but the bands don't apply to its scores.

## The design to start from

**Which direction for which level:** query from whichever side changed.

| Level | Searches | How |
|---|---|---|
| Scheme | one per concept | Forward over the whole collection. The full matrix also **calibrates**: the floor, and the bands by percentile (≥ 0.45 was about the top 15% of pairs here, ≥ 0.54 the top 5%) |
| Concept | 1 | Forward. The governance preview is arithmetic on stored scores |
| Resource | about 16 typical, at most about 40 | The reverse shortlist (about 15 concepts), then those concepts scored forward, narrowed to the document. Skipped when the text the tagger scored hasn't changed |
| A batch of resources | up to one per concept | Forward checks shared across the batch; a full pass once the shortlists cover most concepts |

**Where scores live** (Andy's call; the site's recommendation follows). Not on users' document
types. Not on the scheme either, since a concept can sit in several schemes and its scores don't
depend on any of them. Andy leans to the concept. The recommendation keeps the concept as owner
but not as host: **a hidden document type the plugin ships, one record per concept, with
`liveEdit` on so there are no drafts.** Each record holds:
- the concept's query fingerprint and self-match
- each document's score, with a fingerprint of the document's text
- the author's decisions: excluded, or added by hand

Writing scores into the concept document itself has three problems:
- **Publishing a concept's draft would erase them.**
- **Without an embeddings projection, Sanity embeds the whole document,** so the scores would
  enter the concept's own embedding, which is the anchor, and shift it.
- **Every tagging run would publish concept edits:** history noise, and rebuilds for sites that
  deploy on concept changes.

Keeping each document's top dozen or so scores bounds the records.

**A site's ranker reads the scores.** The consulting site's related-content ranker treats each
tag's score as optional, for a tag-strength tie-break, and ships without scores until this
stream lands. So part of this design is the read contract: the GROQ that projects a document's
tag scores from the plugin's records.

## Open design questions

- **Where each level lives in the Studio:** the Taxonomy tool for the scheme and concept levels, a
  document action or the input for resources, and how all three stay one consistent design.
- **Review and apply.** A draft per document, or a Sanity Release for a batch. Andy plans the
  first full pass on his site through a Release, so the differences can be compared.
- **Configuration:** bands and floor from calibration, the shortlist's size, the chunk size and the
  query fields. Per scheme, per field, or global.
- **Several concept fields on one type,** such as Topic and Genre: scores per field.
- **The existing recommendations:** replace them with the calibrated tagger, keep both, or
  calibrate the reverse direction using the self-match offset.
- **Concept readiness:** surfacing which concepts lack a definition or an example, and perhaps
  helping write them. The research's example rules and its starter prompt are the material.
- **Quota visibility:** what each action will spend, shown before it runs.
- **Projection guidance:** users should set an embeddings projection, so that the score records,
  and anything else that isn't content, stay out of the embeddings.
- **Polyhierarchy:** SKOS has no "first" broader, and the site's tagger and ranker read only the
  first. An explicit option.
- **Content Agent** as the conversational layer over a reproducible preview, not as the decision
  engine.

## How to validate

**Experiment and test in this repository's own dev Studio** (`studio/`, project `zw90ihi2`,
dataset `dev`), **not in the consulting site's lab dataset** (Andy, 2026-11-24). The two projects
were too tightly intertwined during the research, and this stream is where they separate. It
means some setup:
- **Content to tag.** The dev dataset needs a corpus with a vocabulary: created, or copied from
  the site. Copying the site's pieces would let results be compared with v5, but whatever is
  copied should become the dev Studio's own, not a live link back to the site.
- **Embeddings enabled on the dev dataset,** with a projection. The feature backlog already notes
  that this needs confirming.
- The site keeps its `recommendations-lab` dataset and its `dev:lab` Studio script for now, but
  it is not this stream's test bed.

Then:
- **A golden test against `evidence/`:** the plugin's tagger, given v5's matrix and config, must
  reproduce v5's tags exactly. No Studio and no network, in the pure core.
- **A second corpus,** the dev dataset's, tests whether calibration really is reproducible rather
  than tuned to one site.
- **After the plugin ships, the consulting site runs a full tagging pass,** after a backup and
  through a Release. Andy reviews where it disagrees with what he tagged by hand between streams
  1 and 3.

## Before starting

- Read this repository's conventions first: `CLAUDE.md`, the ADRs in `../decisions/` (0001 and
  0002 above all), the tests and the release process.
- Read `research/plan.md` → "Where things stand", "The reverse direction", and Specs → Tagger.
- Read `prototype/`, and `evidence/README.md` for what the golden reference holds.
