> **Archived copy.** From `andybywire/andyfitzgeraldconsulting`,
> `docs/recommendations-research/plan.md`, at commit `ae73f98` (2026-11-24). Paths and links in it refer to
> that repository, where the whole research folder stays in git history at that commit.

# Recommendations research: plan

*Living document. Started 2026-10-21; this version 2026-11-06. Branch: `recommendations-research`.*

## What this is

The work began as notes for one article on taxonomy-based related content. Measurement M3 turned it
into a research project. Its question is **what a taxonomy contributes to a project that also has
embeddings**. The project runs over many sessions, and an article (or several) and a Taxonomy
Manager starter prompt come at the end.

| Doc | Holds |
|---|---|
| `plan.md` | This file: phases, decisions, specs, open questions |
| [value-add.md](value-add.md) | The "why": what a taxonomy adds over embeddings, and where it doesn't |
| [how.md](how.md) | The "how": the steps a reader should take, as we discover them, including what failed |
| `report-m1-m2.md`, `report-m3.md` | Measurements from 2026-10-21, before any taxonomy work |
| `fetch-corpus.mjs`, `measure.mjs`, `m3.mjs` | Measurement scripts, read-only. Run `fetch-corpus.mjs` first; it writes `corpus.json` beside itself. **`measure.mjs` and `m3.mjs` stopped running on 2026-11-23**, when stream 2 removed the old rule they import: check out `b4e85bd` to run them |
| `lab-api.mjs` | The authenticated client the writing scripts share: token from `sanity exec`, and writes to `production-26` refused |
| `tags-backup.mjs`, `tags-restore.mjs` | Snapshot every document's tag fields, and put them back exactly. Restore is a dry run unless given `--write` |
| `backups/` | Committed tag snapshots: the revert points |
| `score-spike.mjs`, `spike-report.mjs`, `scores/` | The score matrix for every document and concept, for one query recipe: `definition`, `example` or `combined` (spends quota; with `--base`, only on new or changed concepts), and its analysis (spends none) |
| `report-spike.md` | How the scores behave, which normalization to use, and threshold tables |
| `baseline.mjs`, `baseline-columns.mjs` | The embeddings-only baseline: raw rankings per page (spends quota), and the two M3 columns derived from them (spends none) |
| `cross-dryrun.mjs` | The cross-category ranker run over `corpus.json`, on the hand tags or a tag set: categories, the effect of the category change, crossing counts by threshold, and the cross cards a rule produces (spends none). **Stopped running on 2026-11-23** with the old rule: check out `b4e85bd` |
| `tagger.mjs`, `tagset.mjs` | The tagger, a pure function from a score matrix to tags (one query per concept, or two combined by mean or max), and its runner, which writes one simulated tag set per version, including the v2 candidates (spends none, writes no dataset). Since 2026-11-06 `tagger.mjs` re-exports `studio/tagger/tagger.ts`, the tagger the Studio runs |
| `tagsets/` | Committed tag sets, one file per version: `v0.json` and on |
| `taxonomy-columns.mjs` | The taxonomy columns of M3.n, the counterpart of `baseline-columns.mjs`: tag sets loaded, topics rebuilt in the query's shape and proved against the hand tags, and the ranker run under a crossing rule, `TAXONOMY_CROSS` unless a version records its own (spends none) |
| `m3-report.mjs`, `m3.0.md` to `m3.5.md` | The M3.n report generator, and its reports, which Andy marks up. From M3.1 it carries the previous report's columns and marks forward and computes only the newest column (spends none, never overwrites a report) |
| `reverse-shortlist.mjs`, `reverse-report.mjs` | The reverse direction: each document's sections querying the concepts (spends one search per chunk), and its analysis against v5 (spends none) |
| `related-algorithm.md`, `what-goes-where.md` | Where the related-resources algorithm landed, as a diagram, and every part sorted between the plugin, a companion, the article and this site |
| `m3-parse.mjs` | Reads a marked M3.n report back into columns, cards, Best marks and notes, for the carry-forward and, later, the extract script |
| `term-candidates.mjs`, `bigram-candidates.md`/`.csv`, `word-candidates.md`/`.csv` | Two-word and single-word term candidates for revision 1, from one fetch of the lab's documents (spends none) |
| `topic-taxonomy.mjs`, `topic-taxonomy.csv` | The lab's Topic scheme in tree order, with each concept's level and how many resources are tagged with it, for revision 1 (spends none) |

## Where things stand (2026-11-21): start here in a new session

**The trajectory.** The taxonomy columns' share of Andy's latest picks, and how often each new
version beat the earlier pick on the pages where it showed something new:

| Report | Changed | Taxonomy / embeddings picks | New version won |
|---|---|---|---|
| M3.0 | baseline | 25 / 48 | — |
| M3.1 | v1: revision 1, genus–differentia definitions | 51 / 22 | 36 of 68 (53%) |
| M3.2 | v2: an example on every concept, in one combined query | 62 / 11 | 40 of 65 (62%) |
| M3.3 | v3: the relaxed crossing rule | 63 / 10 | 15 of 23 (65%) |
| M3.4 | v4: ties by genre, then tag strength, not date | 63 / 10 | 10 of 16 (62%) |
| M3.5 | v5: the Human Factors hierarchy, with Cognition's example rewritten once | 64 / 9 | 5 of 9 (56%) |

**Measured the stricter way** (2026-11-06, from M3.5's marks): how often a column shows the list
Andy picked, in any order. Unlike the picks above, this credits only the configuration that would
ship, so it is the headline to lead with.

| Column | Shows the pick | Cards shared with the pick (mean, of 3) |
|---|---|---|
| Embeddings, unrestricted | 6 of 73 | 1.11 |
| Hand tags | 5 | 0.84 |
| v2 | 26 | 1.97 |
| v3 | 32 | 2.10 |
| v4 | 37 | 2.19 |
| **v5** | **40** | **2.25** |

**Settled:** the vocabulary (Phases 2 and 3), the combined query recipe, the relaxed crossing rule
and the genre-then-strength tie-break. **Explored and set aside**, each recorded where it happened:
an embeddings tie-break (cost), a mention gate on named concepts (a hidden application profile),
full-text TF-IDF, two-query mean and max, weighting rare concepts, and a weighted related match.

**The experiment is closed** (Andy, 2026-11-06). It answered its question: how similarity
routed through a taxonomy's tags differs from an embeddings index's, and where each is strong.
The next gains are in the vocabulary itself, its terms, definitions and relationships, iterated
until ideas are clearly articulated and separated. Related terms wait until that core taxonomy is
solid and vetted in use. So there is no v6 and no further M3 round planned. The work moves to
production.

**Next: three work streams, in order** (Andy, 2026-11-19). Each gets its own plan, and the
third its own kickoff in the plugin's repository. Decided, so no stream reworks another's:

1. **The data: `recommendations-lab` becomes production.** Production's changes since 10-22
   (new, edited and deleted documents, drafts included) come into the lab, under a content
   freeze. v5's tags are written for the 73 judged documents, and Andy tags the few new ones by
   hand. Then the current `production-26` is exported, with drafts and assets, and deleted, and
   the lab is copied into a fresh `production-26`. The name stays, so the site's environment,
   the webhook and the Studio need no new dataset name. On the Free plan, "copy" means an export
   and import, and the copy needs embeddings re-enabled with the projection.

   **DONE 2026-11-21. [stream-1-data.md](stream-1-data.md) is the record**, step by step, on
   branch `lab-to-production`. What went live, and what it left:
   - **The vocabulary and tags:** the revised Topic scheme (75 concepts, seven top concepts), v5's
     tags on the 73 judged documents, Andy's on the three new notes, and production's changes
     since 10-22, his working drafts included. **Genre came from production**, not the lab, since
     production had added Project Note (Andy). The 16 concepts outside every scheme were deleted.
   - **Accepted at A9 (Andy):** twelve old `/insights/tag/` URLs now land on the unfiltered index,
     with no new redirects. Six related bands fall back to "Recent" until stream 2.
   - **For stream 3:** production's fresh embeddings index agrees with the lab's at a rank
     correlation of 0.95 to 0.97, not exactly. Re-measure the tagger's floor and bands there.
   - **The lab stays,** identical to production at the switch, as stream 3's test dataset.
2. **The ranker: a shared, pure TypeScript module,** used by the site's build and, later, by a
   Studio tool that counts how often each piece appears in other pieces' lists. A test runner
   arrives with it, as the first shared code to need one. Built on a branch, and merged after
   the dataset swap: until then the live site runs the old branch rule over the new tags.

   **STARTED 2026-11-21, on branch `related-ranker`.** [stream-2-ranker.md](stream-2-ranker.md)
   → Decided at the start records Andy's five answers. The one that changes this list: **the
   Studio tool is a stream of its own**, after stream 2 merges, and is where the module becomes a
   workspace package. The test runner is `node:test`.
3. **The tagger: the Taxonomy Manager plugin,** at the concept, scheme and resource levels, with
   its scores in records the plugin ships, so users' document types need no extra field. Kicked
   off in the plugin's repository, with a pointer here. Until it lands, production uses the
   plugin as it is today, with no assisted tagging. Then a full tagging pass, after a backup,
   reviewed through a Sanity Release.

**Tag scores ship with stream 3, not before** (Andy). Streams 1 and 2 write and read no scores:
ties break by genre, then date, without tag strength, a small variation Andy accepts. So
`topicScores`, "Suggest topics" and `TopicsInput` stay on this branch as prototypes, and the
branch never merges whole: the research docs merge alone (`docs/**` deploys nothing), the ranker
carries into stream 2, and the tagger is stream 3's reference.

**The ground rules still hold** through stream 2: every step that touches `production-26` waits
for Andy's go-ahead. They held through stream 1, where every read and write of it had one.

**Still owed, outside the streams:** the article's framing and takeaways; the same-work duplicate
(a content-model relation and a ranker rule, Andy's call); `how.md` and `value-add.md`, which
stop at the tagger; and the extract script for trend charts.

**Raised for Andy in a review of the remaining steps (2026-11-06).** Answered since:

- *Whether to run v6 at all:* not now. See "The experiment is closed" above.
- *How new pieces get tagged after promotion:* by hand until the plugin lands (stream 3).
- *Production's hand tags at promotion:* the lab's tags go across, v5's for the judged documents
  and Andy's for the new ones (2026-11-19).

Still open:

- **A blind spot-check before any headline number.** About 20 pages, the final taxonomy list
  against unrestricted embeddings, unlabeled and in random order. One judge built the vocabulary
  and judged labeled columns, and the vocabulary was tuned on the pages it is judged on.
- **The headline metric.** "63 of 73" counts every taxonomy column, including ones that won't
  ship. The honest one is the shipped configuration against the pick, page by page, regressions
  included. It was computed once, for M3.5, by a scratch script (the table above); the extract
  script should compute it every round.
- ~~**Promotion gaps Phase 6 doesn't cover yet:**~~ **Answered at stream 1's A9** (2026-11-20).
  - **The URL contract (Andy's):** facet slugs are `slugify(prefLabel)`, so a renamed or removed
    concept leaves old `?topic=` links on a silently unfiltered index (`nginx/redirects.conf`).
    *The label diff found no renames. Twelve old tag URLs turn unfiltered, and Andy accepted
    that, with no new redirects.*
  - **Search moves too:** `bodyTerms` matches body text against the Topic labels. *The headline
    multiword terms match as many documents as before. The old top-concept labels (design 51,
    development 26) left the body terms, and structural labels such as Goals and Outcomes joined
    them.*
- **The write-up's shape and audience:** a "why" and a "how", or one piece; taxonomists or Sanity
  developers.

## Ground rules

Andy, 2026-10-28. These hold until he lifts them, and they outrank anything later in this file.

- **Nothing in this project touches the live site or `production-26` until Andy explicitly says
  so.** That covers reads as well as writes:
  - **Scripts use the lab only.** `DATASET=production-26` stays unused, and `lab-api.mjs` keeps
    refusing writes there without `--allow-production`. The reports committed on 2026-10-21 were
    made from `production-26` before this rule existed.
  - **No site builds.** `pnpm --filter web build` reads `production-26`, so the site's checks
    (`links`, `validate`, `a11y`, `budgets`) are out too. So is a push of this branch, which runs
    the same build in `checks.yml`. Pushes were already Andy's call.
  - **No merge to `main`.** A merge touching `web/**` deploys production.
- **No changes to the site's pages or templates until the test is finished and the results are
  being rolled in.** The research runs the ranker in memory against simulated tag sets, and that
  needs no page to change. Page work happens in the Promotion phase.

## Decisions

Newest first.

- **2026-11-19.** **The follow-on work is three streams, in order: the data, the ranker, the
  plugin** (Andy). The lab becomes production by being copied into a fresh `production-26`; the
  ranker becomes a shared TypeScript module, with a test runner; the tagger moves into the
  Taxonomy Manager, kicked off in its own repository. No tag scores until the plugin. See
  "Where things stand".

- **2026-11-17.** **Tagging a new document: a reverse shortlist, then forward scores** (the
  experiment; adopting it is stream 3's call). The document's sections query the concepts for a
  shortlist, and only the shortlisted concepts score it forward, on the calibrated scale. A
  shortlist of 15 reproduces v5's tags exactly on 68 of 73 documents; reverse scores alone, on
  9 of 37. See "The reverse direction" under Phases.

- **2026-11-12.** **A removed tag is recorded as excluded when it is removed, not at the next
  run** (Andy). The first build inferred an exclusion at the next run and wrote it only when that
  run was applied, so between the two the draft and the run's review disagreed: the entry said
  "not excluded" while the review said "excluded" (Andy's test). Now the Topics field's input
  writes the mark as the change lands. It watches the value of Topics, because no callback sees
  every edit, and writes only into a draft, and never on a change to the scores alone. See
  Phase 6 → The tagger.

- **2026-11-12.** **`topicScores` takes the shape Claude drafted** (Andy): `{concept, score,
  scoredAt, excluded}`, in a collapsed, read-only "Tagger" fieldset after Topics on the four
  tagged types. This revises the 10-22 shape: `round` is dropped as research-only, the concept
  reference is weak, and `excluded` is new. A topic with no entry is still an author tag. The
  rule's one cost, accepted: an author tag carries no score, so it adds nothing to the tie-break's
  tag strength. `studio/schemas/objects/topicScore.ts` holds the reasoning.

- **2026-11-06.** **The stopgap tagger is a Studio document action, "Suggest topics", not a
  Sanity Function** (Andy). A Function runs on a document event, on a schedule, or when another
  Function calls it; the Studio can't call one. And its natural job, tagging on publish, would
  write after the publish, which means a second deploy and no review. The action writes to the
  draft, for review and one publish. It runs in the lab Studio only until promotion. A Function
  stays the likely way to automate a corpus retag later, and the Taxonomy Manager the long-term
  home.

- **2026-11-06.** **The ranker stays TypeScript; a SPARQL version is deferred** (Andy chose the
  tagger first). Measured on v5's tags: `rankAcross` takes 0.064 ms a page at 73 documents, 2.9
  ms at 7,300, about 21 s for every page there. A page relates on some tier to half the corpus
  and shares a tag with a quarter, so a triple store's indexes would prune by a constant factor
  only. SPARQL's case is expressiveness and portability, not speed. Two findings worth keeping
  for the article: the first-parent rule is an artifact of Sanity's ordered arrays, since
  `skos:broader` is unordered, and the research needed the ranker pure to simulate tag sets.

- **2026-11-06.** **The experiment closes without v6** (Andy). It has taught what it set out
  to. The next step is iterating the vocabulary until ideas are clearly articulated and
  separated, and related terms follow once that taxonomy is solid and vetted in use. The order
  from here: the production tagger, then promotion, then the article's framing. See "Where
  things stand".

- **2026-11-06.** **M3.5 is marked** (Andy). v5 was the pick on 5 of the 9 NEW pages: all 4
  articles and the one case study, and none of the 4 thin pieces, two notes and two talks, where
  his notes ask for hand tags. Latest picks: taxonomy 64, embeddings 9. Measured as the shipped
  configuration against the pick, v5 shows it on 40 of 73 pages, against unrestricted
  embeddings' 6. What comes next, the audit or related terms, is not decided. See Phase 3d →
  M3.5 marked.

- **2026-11-06.** **The hierarchy round is v5, and Cognition's example was rewritten once
  before M3.5** (Andy). Human Factors joins as a seventh top concept, holding Cognition and
  Decision Making, which are new, and Mental Models, moved from User Research. The first build
  tagged the Cognitive Sciences Reading List correctly and left its list on Recent, because no
  other piece shared its new tags; Andy chose a revised example over judging that build. See
  Phase 3d.
  - **Re-scoring is incremental now** (`score-spike.mjs --base`): only concepts whose query text
    changed are queried, with a control, so a round's noise stays out of concepts nobody touched.
  - **Every version pins its score matrix** in `tagset.mjs`. v2 read "the newest combined
    matrix", which v5's would have become; all eight earlier tag sets were re-run from their
    pins and came back identical.

- **2026-11-06.** **M3.4 is marked** (Andy). v4 was the pick on 10 of the 16 lists it changed,
  including all 6 where v3 had been the pick. Andy's next step is the hierarchy work; related
  terms follow as v5. See "Where things stand".

- **2026-11-06.** **Ties are broken by genre, then tag strength, before the date, as v4; related
  links follow as v5, in the tier role** (Andy). An embeddings tie-break was ruled out on cost.
  A weighted related match was built, simulated and taken back out: it credits every piece on
  the other side of a link. See Phase 3c and Phase 4.

- **2026-11-05.** **M3.3 is marked, and the relaxed crossing rule holds** (Andy). v3 was the pick
  on 15 of the 23 lists it changed, 9 of 11 of them presentations. Taxonomy columns now hold 63
  of the 73 latest picks. See Phase 3b.

- **2026-11-05.** **The taxonomy crossing rule is relaxed from v3, before related terms are
  added** (Andy): at least 2 shared tags, making up at least half of the pair's tags, and at
  most 1 cross card. v3 is v2's tags under it, judged in M3.3; the related-terms round becomes
  v4. The old rule stays behind the v0 to v2 columns. See Phase 3b.

- **2026-11-05.** **M3.2 is marked** (Andy). v2's list was the best on 40 of the 65 NEW pages and
  on 3 of the repeats, 43 in all. The taxonomy columns now hold 62 of the 73 picks, against 51
  in M3.1 and 25 in M3.0. See Phase 3 → M3.2 marked.

- **2026-11-05.** **Revision 2 adds an example to every concept, and v2 is scored on one query
  that contains it** (Andy). Of three candidates, one combined query, and two queries combined by
  mean or by max, he chose the combined query: it fixes Sanity's over-application while keeping
  v1's tag volume. See Phase 3.
  - **2026-11-04: no per-concept rules in the tagger** (Andy). A gate or a flag set for some
    concepts would be a metadata application profile hidden in code. Anything the tagger does
    applies to every concept alike, and what varies by concept lives in the vocabulary.

- **2026-11-03.** **M3.1 is marked** (Andy). Every page has one v1 pick. v1's list was the best
  on 36 of the 68 NEW pages, and on 2 more where it repeated an earlier list. The taxonomy columns
  now hold 51 of the 73 picks, against 25 in M3.0. See Phase 2 → M3.1 marked.
  - **Best rows are kept per round** from M3.1 on: `v0 Best`, `v1 Best` and on, with earlier
    picks grayed to ☑️. See M3.n evaluation reports.

- **2026-11-02.** **Revision 1's scheme is in, and its definitions follow genus–differentia** (Andy).
  - **The scheme** keeps its title "Topic" and its id, `skosConceptScheme87f8b2e73674`, so the
    scripts needed no change. It has 6 top concepts (Engineering Practice, Design Practice,
    Design Approach, Project Management, Engineering Tool, Outcome) and 66 concepts below them.
    The "Topic v0" copy Andy made first is deleted; it referenced the same concept documents, so it
    never held the old hierarchy anyway. `topic-taxonomy.csv` and the tag sets hold that.
  - **Every definition is written as genus–differentia:** "X is a [parent] practice, method or
    outcome that …", naming the parent rather than restating its definition, and without filler or
    other concepts' names. Andy asked for it across the scheme, so that tagging isn't skewed by
    the definitions' differing shapes. Claude drafted, Andy revised and published.
  - **The tagger and the ranker read only a concept's first parent** (`broader[0]`), and round 1
    keeps that rule by default. Andy has not ruled on it. Two concepts have two parents:
    Prototyping, whose parents are both top concepts, so the rule changes nothing, and Structural
    Analysis, whose second parent, Evaluation, is invisible to both.

- **2026-10-29.** **M3.0 is marked, and revision 1 is planned** (Andy).
  - **The marks:** one ✅ on each of the 73 pages. The best list came from an embeddings column on
    47 pages and from a taxonomy column on 25, with one tie. See Phase 1 → M3.0.
  - **Revision 1 edits the lab's Topic scheme in place,** not a new scheme, which keeps the wiring
    simple. Andy sorts three lists in Miro first: the bigram list, the new single-word list and
    the taxonomy CSV.
  - **M3.1 flags only lists that are new.** A page is flagged when its v1 cards, in any order,
    match none of the lists already shown for it. Andy re-evaluates only those, against the Best
    he has already chosen. Every other page keeps its mark. See M3.n evaluation reports.

- **2026-10-28.** **The taxonomy's crossing rule is at least 3 shared tags, a shared ratio of at
  least 0.40, and at most 1 cross card** (Andy). It is calibrated on tag set v0 and held fixed
  through revisions 1–3, so each M3.n column measures the vocabulary, not a moved bar.
  - **Where it lives:** `TAXONOMY_CROSS` in `baseline-columns.mjs`, beside the embeddings rule
    `CROSS`. `CROSS_RULE` in `lib/related.ts` keeps its provisional values (0.5, 2, 1) until
    promotion, when it takes the research's final rule.
  - **Why 3 tags:** it crosses on 15 pages against the embeddings column's 19, and 12 of the 15
    also cross under embeddings. It recovers 5 of the 12 strongest embeddings crossings, most of
    them the same work in two forms; the hand tags recovered none. Requiring 2 tags can't get near
    19 (see Phase 1).

- **2026-10-28.** **v0 keeps "more specific wins," and the overlap it exposed goes to revision
  1** (Andy). The rule drops some broader concepts that are plainly a document's subject: *What
  Is Information Architecture?* loses Information Architecture (0.814, its best match) to
  Navigation Design (0.571). The cause is the vocabulary, not the rule: Navigation Design's
  definition reads like IA in general, so it shadows IA on IA-centric pages. Revision 1 fixes the
  definition, which tests what the taxonomy contributes. Changing the rule would have the tagger
  cover for a weak definition.
  - **Measured, the alternative:** when a pair collides, keep the higher score. That changes 15
    documents and restores IA on the IA-titled pages, putting IA on 15 documents and Navigation
    Design on 8. But it reproduces fewer hand tags: 83 of 207, against v0's 90. Hand tags tend to
    be specific, so they favor the current rule, and they're a weak benchmark.
  - **The cost, accepted:** until revision 1, v0 shows IA missing from IA pages, and M3.0 will
    reflect it.

- **2026-10-28.** **The page wiring moves to promotion, and the two ground rules above were set**
  (Andy). Simulated runs call `rankAcross` from `lib/related.ts` directly, so the pages never
  needed to change for the research.
  - *The wiring was built and verified anyway (73 of 73 built pages matched the ranker). It came
    from following this plan's Phase 1 list without asking whether M3.0 needed it, which is the
    same mistake as the 2026-10-26 "tag resources" one.*
  - It was rolled back and kept as a git stash for promotion; see phase 6.
  - Verifying it read `production-26` twice, with a corpus fetch and a site build. Both were
    reads, and both came before the rule.

- **2026-10-27.** **The taxonomy's crossing rule also needs a minimum count of shared tags,
  `crossMinCount`** (Andy). A ratio alone let one shared tag between two thinly tagged documents
  count as strong. Provisionally, `CROSS_RULE` in `lib/related.ts` is `crossMinShared` 0.5,
  `crossMinCount` 2 and `crossMax` 1. On the hand tags that crosses on 26 of 73 pages. Both
  values are calibrated on tag set v0.

- **2026-10-27.** **"Embeddings, same rules" crosses at `crossMin` 0.70, with at most one cross
  card** (Andy). That's 9 of 44 insight pages and 10 of 29 presentations. At 0.80 only exact
  same-work pairs crossed; the band down to 0.70 was still mostly topical.
- **2026-10-26.** **Evaluation is simulated, and the baseline is made fair** (Andy):
  - **Tag rounds are simulated in memory.** The tagger turns a score matrix into a tag set per
    version, saved as a file, and the site's real ranker runs over it. No tags are written to the
    dataset until the manual audit and promotion. So the `topicScores` schema field waits until
    then. *The plan said "tag resources" from the start, and it was taken to mean "write tags"
    without asking whether evaluation needed it. It doesn't.*
  - **M3.0 has two embeddings columns:** unrestricted, which is what embeddings alone would show,
    and the same category rules as the taxonomy, which isolates what the vocabulary adds.
  - **The embeddings baseline searches with the title, summary and opening of the body**, not the
    title and summary alone. That way the baseline isn't a strawman.
- **2026-10-26.** **The tagger's scale, thresholds and minimum** (Andy), after the score spike:
  - **The anchored 0–1 scale.** Accuracy was the same as raw (AUC 0.765 against 0.767); this one
    is readable.
  - **Round-0 bands:** up to 3 tags at ≥ 0.45, then up to 3 more at ≥ 0.54.
  - **At least one tag per document.** A thin document that clears neither band keeps its best
    concept. Andy's call, over the recommendation to leave it untagged and flagged. The trade is
    some wrong tags, like *Proust and the Squid*'s top match, against no document falling back to
    "Recent". Such a tag stays bumpable, so later rounds can correct it. *That match is
    Discoverability on raw scores, the order report-spike.md lists them in, and Responsive Design
    on the anchored scale the tagger uses: 0.272 against 0.259.*
- **2026-10-26.** **When a concept and its broader both qualify, the more specific one is kept**
  (Andy). This is the indexing rule of specificity, and the ranker's "nearer" tier already infers
  the parent. A **rule of N** stays a configurable variant, **off in round 0**: a document
  qualifying for N or more children of one broader concept gets the broader concept instead.
- **2026-10-26.** Six open questions settled (Andy):
  - **The Best row in M3.n is left blank,** and Andy pastes ✅ into the cell of the version he
    judges best. It is easy to scan, and the extract script can read it.
  - **The embeddings column** is the unrestricted top 3. It is computed once in M3.0 and reused,
    because the experiment changes no content text, only tags and concepts.
  - **The Hand tags column** is in M3.0, as the baseline.
  - **No document carries both a concept and its own broader concept.** The parent can be
    inferred, so carrying both is redundant. The hand tags already nearly follow this rule: 7
    pairs on 5 of 73 documents, measured in the lab on 2026-10-26.
  - **`topicScores` is read-only and collapsed** in Studio.
  - **Quota** is about 55 tagging queries a round, plus refreshes. Embeddings results are cached
    across M3 runs.
- **2026-10-22.** **The lab is set up: `recommendations-lab`**, a faithful copy of `production-26`.
  See "Where the experiments run" for how it was made and checked.
- **2026-10-22.** **The experiments run in a lab dataset** (Andy). The old `production` dataset was
  exported to `~/Archives/afc/2022-production-dataset-2026-10-22/production.tar.gz`, and **Andy
  deleted it** to free the slot.
  - **Contents:** 221 documents (209 published and 12 drafts) and 280 assets, 241 MB. That includes
    the four `service` documents.
  - **Checked against the live dataset before deleting:** every published ID was present.
- **2026-10-22.** The tagger gets a common score scale by **normalizing Sanity's scores, after a spike**
  to see how they are distributed. Sanity's `_score` is not 0–1 and cannot be compared across
  queries, so thresholds wait for real numbers.
- **2026-10-22.** A tag's match score lives in a **parallel field**. `topic` stays an array of
  references, unchanged, and a new `topicScores` holds `{concept, score, round, scoredAt}`. A tag
  in `topic` with no score entry is author-added and is never bumped.
- **2026-10-22.** The first auto-tag round **retags from scratch**, after a backup. Author tags first
  appear at the manual audit.
- **2026-10-22.** There are **two categories, Insights and Presentations.** Insights covers articles,
  case studies and notes.
- **2026-10-21.** Andy reviewed M3: many embedding matches beat the taxonomy's. Others match on *form*
  (conference recaps find conference recaps) and miss *topical* matches deeper in the archive. The
  article is paused for this research.
- **2026-10-21.** Dataset embeddings are on for `production-26`. The projection is per type, with no
  transcripts; it is in `report-m3.md`'s header and in the
  [how.md](how.md#enable-dataset-embeddings-with-a-projection-per-type) step.

## Where the experiments run: a lab dataset

**Decided 2026-10-22.** The Free plan allows two datasets, and the second slot came from the old
`production` dataset.

- **Why.**
  - **Publishing continues.** The live site keeps publishing and deploying, with its webhook on.
  - **Live URLs stay safe.** Taxonomy restructuring cannot break facet URLs (`?topic={slug}`) or
    the `/insights/tag/` redirects partway through.
  - **The preview is unaffected.** It reads drafts per request, so it would otherwise show every
    experimental write at once.
- **How it was made (2026-10-22).**
  1. The old `production` dataset was exported to the archive, and Andy deleted it.
  2. **No cloud copy is available:** `sanity datasets copy` is refused on the Free plan ("advanced
     dataset management"). The lab was made by export and import instead: published documents
     only, **with assets** (1,033 files, 1.1 GB).
  3. **The first import left out the assets, and that was a mistake.** It also stripped the body
     figures, along with their alt text, from 17 documents, and embeddings scores drifted. It was
     re-imported in full; see [how.md](how.md#what-didnt-work).
  4. Embeddings were enabled with the same projection as `production-26`.
- **How it was checked.** Every embedded field, tag and taxonomy relation matches `production-26`
  across 148 documents. The only difference is cosmetic: `broader[0]._weak: false` is omitted on 11
  concepts, which means the same thing. A semantic probe ranks identically, with scores within 0.01.
- **The webhook can't fire for the lab.** The project's only webhook ("Publish Update") is scoped
  to `production-26`.
- **Working in it:**
  - **Studio:** `pnpm --filter studio dev:lab` serves the lab on :3031, titled "AF Consulting · LAB",
    with Presentation left out, since it previews `production-26`. The deployed Studio is
    unchanged; `studio/sanity.config.ts` says why this is an env var and not a second workspace.
  - **Scripts:** `node fetch-corpus.mjs` reads the lab by default, and `DATASET=production-26` reads
    the live dataset, which is not to be used without Andy's go-ahead (see Ground rules).
    `measure.mjs` and `m3.mjs` take the dataset from `corpus.json`. Reports from
    any dataset other than `production-26` are named `report-*.<dataset>.md`, so the committed
    reports are never overwritten.
- **Cost.**
  - **Promotion at the end:** move the concept and scheme documents into `production-26`, then
    re-run the tagger there. It is deterministic, at about 55 queries.
  - **The lab won't hold new pieces.** Anything published live during the experiment is not part
    of it.
- **If we stay on `production-26`** (Andy's first plan):
  - the webhook stays off for the whole experiment
  - no merge to `main` that touches `web/**`, since any deploy ships the experimental tags and
    taxonomy
  - the preview shows every write
  - taxonomy renames need a pass over the redirects

## Phases

Each phase is one or more review stops. **"Retag" means:**
1. re-score whatever concepts changed
2. run the tagger to produce the next tag-set file, *simulated, with nothing written*
3. generate the next M3.n from it

Tags reach the lab dataset only in phase 5. Nothing reaches `production-26` or the site before
phase 6, and phase 6 waits for Andy's go-ahead.

### 0. Setup

- [x] Tracking docs (this folder)
- [x] Decide where the experiments run: a lab dataset (above)
- [x] Set up the lab: copy `production-26` with its assets, enable embeddings, add a local Studio
      switch, and parameterize the scripts by dataset
- [x] **Back up tags** (2026-10-26). The first backup is
      `backups/tags-recommendations-lab-20261026T234921Z.json`: 73 documents, 71 tagged, no drafts.
      - **Checked** against public reads of both the lab and `production-26`, with every `topic`
        identical and array `_key`s kept.
      - **Restore tested on one document:** `proust-and-the-squid`'s tag was swapped and a
        `topicScores` entry added. A dry run flagged that document alone, `--write` put back the
        original tag with its original `_key` and removed the scores, and a full dry run then
        reported 0 differences.
      - **The guard holds:** writes to `production-26` are refused without `--allow-production`.

      Run both from the repo root:

      ```bash
      pnpm --dir studio exec sanity exec ../docs/recommendations-research/tags-backup.mjs --with-user-token
      pnpm --dir studio exec sanity exec ../docs/recommendations-research/tags-restore.mjs --with-user-token -- --id <documentId>
      ```

      **Take a fresh backup before every tagging round.** Restore picks the newest lab backup
      unless given `--file`.
- [x] **Score spike** (2026-10-26). `score-spike.mjs` scored 73 documents against 55 concepts (55 queries) into `scores/spike-recommendations-lab-20261026T235419Z.json`. `spike-report.mjs` reads that matrix, spends no quota, and writes `report-spike.md`. What it found:
      - **Raw scores are nearly comparable across concepts after all.** Every concept's floor sits
        between 5.0 and 6.1, never at zero, but the spread inside a concept (2–3 points) dwarfs the
        spread between concepts (about 1).
      - **No normalization that ignores the corpus beats raw.** Global AUC against the hand tags:
        raw 0.767, a fixed-floor 0–1 scale 0.765, self ratio 0.762. The best number, 0.774, needs
        each concept's lowest document score, so it moves whenever something is published, which
        the incremental tagger can't live with. **So the scale is chosen for readability, not
        accuracy.**
      - **The signal is moderate:** 0.78 AUC within a concept, and 46% of hand tags in a
        document's top 4. The hand tags are incomplete, so that is a floor. M3.0 is the real test.
      - **The matches look sensible in the examples.** *Knowledge Graphs and IA* has no tags, and
        its top three are Knowledge Graphs, Information Architecture and Linked Data.
      - **Thin documents clear nothing.** At a cutoff covering the top 10% of pairs, six get no
        tags: short notes, and presentations whose text is only a description and highlights.
      - **Hubs are broad concepts.** Information Architecture is in 23 documents' top 4 and
        hand-tagged on 6. The specificity rule tames this: in 26 documents, a concept and its
        parent sit together in the top 4.
- [x] **Andy chose the scale, the starting thresholds and the minimum** (2026-10-26): the anchored
      0–1 scale, bands of 3 at ≥ 0.45 and 3 more at ≥ 0.54, and at least one tag per document.
      See Decisions and Tagger.

### 1. Pre-test (Taxonomy v0)

- [x] **The embeddings baseline** (2026-10-27). `baseline.mjs` ran 73 queries, one per page, and
      cached the raw rankings in `scores/baseline-recommendations-lab-20261027T004131Z.json`.
      `baseline-columns.mjs` derives both columns from that file at no cost. What it found:
      - **A query is read up to about 2,000–2,500 characters, and the rest is ignored without an
        error.** Measured on a 30,944-character article: its self-score went flat by about 2,000
        characters, and everything from 2,500 to 31,000 fell within the noise. So the query is
        title, summary and body opening, **capped at 2,500**.
      - **Identical queries vary by up to 0.003.** That's the reason to compute once and cache.
      - **The yardstick works.** 72 of 73 pages match themselves best. The exception, the *Yes,
        And* keynote, matches a related document more closely.
      - **Presentations give thin queries:** median 734 characters, against the cap of 2,500 for
        every article and case study. The baseline is weaker for them, and that comes from the
        content, not the method.
      - **Unrestricted embeddings cross categories all the time:** 24 of 44 insight pages, and 29
        of 29 presentations.
      - **The strongest crossings are the same work in two forms**, with anchored scores of
        0.78–0.98. *Conversations with Robots* appears as an article and a talk, *Boutique
        Knowledge Graphs* as a method and a talk, and *Domain Modeling* and *Deskilling* in two
        versions each.
- [x] **Andy set `crossMin` 0.70** for the same-rules column (2026-10-27). It's recorded as `CROSS`
      in `baseline-columns.mjs`, with at most one cross card. Both columns are now settled, and
      they're derived from the cached rankings whenever M3 needs them.
- [x] **Cross-category ranking: the logic** (2026-10-27). `rankAcross`, `genresByCategory` and
      `categoryForType` are in `web/src/lib/related.ts`, *beside* the old branch rule, so the pages
      still build. The changes:
      - **One genre walk.** `lib/genres.ts`'s `subtree` is exported, since the ranker is its
        second consumer.
      - **One query change.** `RELATED_POOL_QUERY` projects each genre's full `broader`, and
        TypeGen was re-run.
      - **One import with a `.ts` extension,** the first in `src/`, so the research can load the
        ranker under plain Node.
      - **Checked:** `astro check` reports 0 errors, warnings or hints. M1/M2's guard confirms
        the old ranker is unchanged on 73 of 73 pages.

      `cross-dryrun.mjs` ran it on the hand tags:
      - **The categories are right.** Insights is Document and 7 genres; Presentations is
        Presentation and 5. No page sits outside a category or disagrees with its type.
      - **The category change alone changes 12 of 73 lists** (6 notes, 6 articles).
      - **The crossing bar is coarse on hand tags.** Pages crossing go 52, 46, 35, 32 at a bar of
        0.25, 0.33, 0.40, 0.50, then 2 at 0.67. With 2–4 tags per document, the shared ratio
        takes few values, so nothing lands near the embeddings column's 19.
      - **What crosses at 0.50 is mixed.** Many crossings hang on one shared tag. Requiring two
        shared tags trims 32 to 26, but a pair like *UW Medicine* ↔ *Taxonomy Management* still
        crosses.
      - **The hand tags miss the same-work pairs that embeddings rank strongest.** For example,
        the *Conversations With Robots* talk crosses to *Flying Cars*, not to its own article.
- [x] **Tagger** (2026-10-28), as a pure function in this folder (see spec): score matrix, config
      and author tags in; a tag set per document out. It may later move into Taxonomy Manager.
      - `tagger.mjs` holds it, with no I/O. `tagset.mjs` runs it over a cached matrix and writes
        `tagsets/<version>.json`.
      - **Two pieces are not built:** the rule of N, which throws if switched on, and the
        incremental bump. Round 0 retags from scratch, so it needs neither. See Open questions.
      - **"Both qualify" is read as "both earned a slot"**, which Andy should confirm. See the
        Tagger spec.
- [x] **Tag set v0** (2026-10-28), simulated from scratch with the round-0 config, in
      `tagsets/v0.json`. It reuses the spike matrix, which ran the round-0 query, so it spent no
      quota.
      - **231 tags on 73 documents:** 190 in band 1, 37 in band 2, and 4 on the minimum. 39
        documents have three tags, 8 have six, and 9 have one.
      - **On the minimum,** all below 0.45: *Proust and the Squid* (Responsive Design, 0.273),
        *Why Shortcuts Aren't the Road* (Content Analysis, 0.424), *Design for the Human Scale*
        (Interaction Design, 0.433) and *IA, the Current and the Future* (Information
        Architecture, 0.445). The spike predicted 4 documents clearing no bar at 0.456.
      - **The specificity rule changed 22 documents,** dropping 23 broader concepts.
        `tagset.mjs` lists them, widest gap first.
        - **13 outscored the child that replaced them, and 8 were the document's best match.**
          Three were hand tags.
        - **Information Architecture was dropped 10 times, 7 of them for Navigation Design.**
          That includes *What Is Information Architecture?* (0.814 against 0.571) and *When Do
          You Need an Information Architect?* (0.685 against 0.523).
        - **Content Strategy was dropped 6 times,** but in 4 its child scored higher. That's the
          rule working as meant.
        - Andy kept the rule; see Decisions, 2026-10-28.
      - **The hubs moved.** *Content Analysis* is on 21 documents (5 by hand), *Search* on 11 (0
        by hand), *Sanity* on 14 (4), *Navigation Design* on 14 (3). *Information Architecture*
        is on 8 (6 by hand), down from 23 documents' raw top four.
      - **90 of the 207 hand tags were reproduced**, so 141 of v0's 231 tags are new. Whether
        they are better is what M3.0 is for.
      - **Checked:** no tag beside its broader, every tag clears its slot's bar, band 2 fills only
        after band 1, and no document has more than six tags or a duplicate.
- [x] **Calibrate the crossing rule on v0** (2026-10-28). `cross-dryrun.mjs` now ranks on a tag
      set, after checking that the topics it rebuilds from the Topic scheme match the query's
      projection exactly. The target was the embeddings same-rules column: 19 pages crossing.

      | Rule (ratio, shared tags) | Pages crossing | Also cross under embeddings | Same card | Strongest 12 found |
      |---|---|---|---|---|
      | 0.50, 2 (the provisional `CROSS_RULE`) | 28 | 11 | 4 | 4 |
      | 0.52 to 0.60, 2 | 7 | 3 | 0 | 0 |
      | **0.40, 3 (chosen)** | **15** | **12** | **6** | **5** |
      | 0.50, 3 | 11 | 9 | 4 | 4 |

      - **There's a cliff at 2 shared tags.** No v0 pair has a ratio strictly between 0.50 and
        0.60, so crossings fall from 28 to 7, and nothing in between is reachable.
      - **At 3 shared tags the ratio barely matters:** anything from 0.01 to 0.40 gives the same
        15. The 0.40 guards against two heavily tagged documents sharing 3 of 9.
      - **What crosses:**
        - **Same-work pairs:** both *Domain Modeling* pairs, both *Boutique Knowledge Graphs*
          pairs, and *Structured Content Design Workflow 2022* to *Structured Content in Product
          Design*.
        - **The other 10 are topical.** For example, *Deskilling Large Language Models* goes to
          *AI Assisted Content Operations*, and *Taxonomy Management in Sanity Studio* to
          *Purpose-Driven Taxonomy Design*.
        - **Still missed:** the *Conversations With Robots* talk crosses to *Boutique Knowledge
          Graphs*, not to its own article.
      - **"Strongest 12"** are the pages whose best cross-category match scores ≥ 0.78 anchored in
        the embeddings baseline. Most are the same work in two forms. Two are close neighbors
        instead: *AI Assisted Content Operations* → *Self-Hosting Sanity Studio*, and *Ranked
        Lists of Related Content* → *Sanity Studio Taxonomy Migration*.
      - **With crossing off, v0 changes 15 of 73 lists against the old branch rule,** against 12
        on the hand tags.
- [x] **M3.0** in the new evaluation format: `Embeddings | Embeddings, same rules | Hand tags |
      Taxonomy v0`. Generated 2026-10-28 and **marked by Andy on 2026-10-29**: one ✅ per page,
      no notes.

      | Best list | Pages |
      |---|---|
      | Embeddings | 24 |
      | Embeddings, same rules | 24 |
      | Hand tags | 13 |
      | Taxonomy v0 | 12 |

      - **By method:** an embeddings column on 47 pages, a taxonomy column on 25, and 1 page where
        the chosen list appears in both.
      - **By type:**

        | Type | Embeddings | Taxonomy | Tie |
        |---|---|---|---|
        | Articles (31) | 15 | 15 | 1 |
        | Case studies (7) | 5 | 2 | 0 |
        | Notes (6) | 5 | 1 | 0 |
        | Presentations (29) | 22 | 7 | 0 |

      - **Shared lists:** on 13 pages the chosen list was identical in both embeddings columns,
        and on 1 more it was identical in those two and the hand tags. A ✅ lands in one column
        only, so the per-column counts split those pages.
      - **What the generator reported at generation:**

        | Column | Pages with a cross card | "Recent" fallbacks | Mean agreement with the column to its left |
        |---|---|---|---|
        | Embeddings | 53 | 0 | — |
        | Embeddings, same rules | 19 | 0 | 2.01 of 3 |
        | Hand tags | 6 | 2 | 0.78 of 3 |
        | Taxonomy v0 | 15 | 0 | 0.62 of 3 |

      - **The hand tags cross on only 6 pages under `TAXONOMY_CROSS`,** since few hand-tagged
        pairs share 3 tags. That's the fixed rule applied to them, not a separate setting.
      - **v0 agrees with the hand tags on 0.62 cards of 3.** The two tag sets rank quite
        differently, so the Best marks are what say which is better.

*The page wiring was listed here until 2026-10-28. It is in phase 6.*

### 2. Taxonomy revision 1

**Inputs found so far,** from evaluating earlier rounds:

- **Navigation Design overlaps Information Architecture** (v0, 2026-10-28). Its definition
  describes IA in general: "an intuitive, efficient, and user-friendly system for finding
  content", "structuring and arranging" to give "easy access to information". So it scores high
  wherever IA does, and the specificity rule then drops IA for it on 7 documents, including
  *What Is Information Architecture?*. Narrow the definition to the navigation system itself, or
  add a scope note that says what belongs to IA instead.
  - **How to tell it worked:** re-score Navigation Design alone (one query) and re-run
    `tagset.mjs`. IA should stop appearing in the dropped list against Navigation Design on the
    IA-titled pages.

- [x] **Three lists to sort in Miro** (2026-10-29):
  - **Both term lists come from `term-candidates.mjs`,** in one fetch of the lab's 73 documents,
    so they cover the same content the research tags.
  - **Bigrams:** `bigram-candidates.md` (the top 80) and `bigram-candidates.csv` (all 611). It is
    `web/scripts/phrase-candidates.mjs`'s process unchanged: the search index's prose and
    tokenizer, 3 uses across 2 documents, G² ≥ 10.83, and existing labels excluded.
    - **Why it was re-run** (Andy, 2026-10-29): the list in `docs/phrase-candidates.md` came
      from `production-26` on 2026-09-14, over 53 documents, before many presentations had text.
      That script reads `web/.env`, which is `production-26`, so it was not re-run itself.
    - **What changed:** 72 of the top 80 are the same, and the total grew from 493 to 611, mostly
      further down. New in the top 80: *user experience*, *information environments*, *business
      goals*, *key concepts*, *multi device*, *purpose driven*. *domain modeling* is gone, now
      that Domain Modeling is a label.
  - **Single words:** `word-candidates.md` (the top 120) and `word-candidates.csv` (all 182). It
    uses the bigram list's prose, tokenizer, floors (3 uses, 2 documents) and label exclusion.
    The score differs, because G² needs two words. A word scores by how many documents it is one of the top 25 TF-IDF
    keywords of, which is the search index's own measure, and it must reach 2. It is noisy, as
    the bigram list is: *tags*, *llm*, *classification* and *authoring* sit beside *andy* and
    *hands*. Singulars and plurals stay separate, because the shared tokenizer doesn't stem.
  - **The taxonomy:** `topic-taxonomy.csv`, from `topic-taxonomy.mjs`. It has 59 concepts in
    tree order (4 at level 1, 11 at level 2, 44 at level 3), each with its direct hand-tag count,
    its count including narrower concepts, its v0 count, its definition and its scope note.
    12 concepts below the top level have no direct hand tag.
- [x] **Andy sorts the lists in Miro, then edits the lab's Topic scheme in place** (2026-11-02).
  See Decisions. 26 concepts are new, and 13 left the scheme. Their hand tags stay where they
  were: 32 point at concepts outside the scheme, and 4 at Project Management, now a top concept.
  - **Topic references are strong.** The lab's hand tags still point at today's concepts, so the
    Studio won't delete a concept that a document still references. The tag backup from
    2026-10-26 holds the hand tags if they need clearing first, and M3.0 already records the
    Hand tags column, so clearing them changes no report.
- [x] **Retag round 1, then M3.1** (2026-11-03).
  1. **Corpus re-fetched:** the same 73 documents as v0.
  2. **Every concept re-scored,** 66 queries, since nearly every definition changed:
     `scores/spike-recommendations-lab-20261103T011931Z.json`. The concepts' own embeddings were
     checked first: on five rewritten concepts, each matched its new text better than its old.
     The floor still fits (lowest raw score 4.99, against v0's 4.98), and self-matches rose by a
     median of only 0.11, so round 0's configuration is kept unchanged.
  3. **Tag set v1:** 217 tags, 7 documents on the minimum (v0 had 4), 44 of 66 concepts used.
  4. **M3.1:** `m3.1.md`, with M3.0's columns and marks carried forward. **68 of 73 pages are
     flagged NEW.** The flags were checked against a direct comparison of card sets, and the
     carried embeddings columns against a fresh computation: both agree on all 73 pages. v1 is
     one card away from an earlier list on 32 of the 68.

  **What v1 shows, before Andy's marks.** These are proxies; the marks decide.
  - **Against the lists marked Best,** on the 61 pages where v0 wasn't marked Best: v1 shares 0.79
    cards of 3 and v0 0.87. v1 is closer on 10 pages, further on 17, level on 34. On the 12 pages
    where v0 was marked Best, v1 keeps 1.08 of its cards.
  - **v1 agrees with v0 on 1.21 cards of 3,** and crosses on 15 pages, as v0 did.

  **Inputs found for revision 2:**
  - **The Navigation Design overlap is gone, and the same drop now comes from Search and Site Map.**
    Information Architecture was the best match on *What Is Information Architecture?* (0.815)
    and *When Do You Need an Information Architect?* (0.686), and a hand tag on both, yet it was
    dropped for Search (0.581) and Site Map (0.472). Both definitions open "… is an information
    architecture practice / model", so they score high wherever IA does. That is the cost of
    naming the genus in a child's definition, under "more specific wins".
  - **Hubs:** Sanity lands on 19 documents (4 by hand), Search on 10 (0 by hand), Structured
    Content on 24 (19 by hand).

- [x] **M3.1 marked** (Andy, 2026-11-03). One v1 pick on every page, notes on five.

  | Best list from | v0 Best (M3.0) | v1 Best (M3.1) |
  |---|---|---|
  | Embeddings | 24 | 10 |
  | Embeddings, same rules | 24 | 12 |
  | Hand tags | 13 | 8 |
  | Taxonomy v0 | 12 | 5 |
  | v1 | — | 38 |
  | **Embeddings / taxonomy** | **48 / 25** | **22 / 51** |

  - **v1 won 36 of the 68 NEW pages,** and 2 of the 5 repeats, where its list was already shown.
    It beat the earlier pick from every column: Embeddings on 13 of 24, Embeddings, same rules on
    12 of 24, Taxonomy v0 on 8 of 12, Hand tags on 5 of 13. The hand tags held up best.
  - **By type,** embeddings / taxonomy picks went from 22 / 7 to 10 / 19 on presentations, 16 / 15
    to 7 / 24 on articles and 5 / 1 to 1 / 5 on notes. Case studies stayed with embeddings, 5 / 2
    to 4 / 3, and v1 won only 2 of the 7.
  - **How much v1 changed barely mattered.** It won 5 of 8 NEW pages where it swapped one card of
    the v0 pick, 20 of 37 where it swapped two, and 10 of 22 where it swapped all three.
  - **Several picks were close.** Four of the five notes say so.
  - **Two pages moved between lists already shown,** both toward v0's list: *Designing and
    Implementing Semantic Data Layers*, and *Design for Difference*, where v1 repeats v0. Seeing
    more options can change how a list reads, which is worth remembering when rounds are compared.

  **Inputs for revision 2, from the marks.** Win rates on NEW pages, by a tag v1 gave the page:
  - **Taxonomy: 2 of 11,** the weakest. The concept has no narrower concepts, so taxonomy design,
    tooling, governance and auto-categorization all look alike to the ranker. 7 of the 9 NEW
    pages with "taxonomy" in the title went to another column.
  - **Search 3 of 10, Site Map 1 of 5:** the two concepts round 1 flagged for dropping IA.
  - **Sanity 9 of 18.** Andy's note on *Taxonomy Boot Camp 2024 Themes & Takeaways*: "I'm not sure
    why articles like this are being tagged with 'Sanity' — that may need to go in a different
    vocabulary." A tool is what a piece used, not what it is about, so a shared tool tag ties
    unrelated pieces together. A separate facet for the Engineering Tool branch, which the ranker
    could weight or ignore, is a content-model question and Andy's to decide.
  - **Strongest:** Content Modeling 11 of 15, Structured Content 14 of 23, and Information
    Architecture 5 of 8 where v1 kept it.

### 3. Taxonomy revision 2: examples

**Before the examples: three concept edits and what they showed** (2026-11-04).

- **Taxonomy got three children, Development, Governance and Implementation, and lost them again**
  (Andy). A dry run of the tagger showed all three landing on the same 9 to 11 documents: a
  document's three scores sat only about 0.05 apart, and a sharper rewrite didn't separate them.
  Andy folded them back into Taxonomy, with a scope note naming all three, rather than add
  workaround logic to the tagger. The concepts stay in the lab outside the scheme.
- **Sanity and Search were narrowed, and wording alone couldn't make them strict.** A definition
  dense with Sanity's own vocabulary still matched pieces that never mention it: Sanity went from
  19 documents to 15, 6 of them never naming it. The ranking was right; the bar was too low for
  a corpus where nearly everything is about content systems. **You can't define your way out of
  semantic similarity.**
- **A mention gate on named concepts was proposed and declined** (Andy): a list of gated concepts
  in the tagger is a metadata application profile hidden in code. Counting the vocabulary's own
  labels in a document (lib/keywords.ts → findTerms) is kept as a possible later path, as a
  uniform boost rather than a gate. Full-text TF-IDF is not: it surfaces what is unusual about a
  document, not what it is about, so "sanity" isn't among the top 25 terms of a piece that names
  it 44 times.

- [x] **Examples on every concept** (Andy reviewed and published, 2026-11-05). Claude drafted
  them as archetypes: about 400 characters of practitioner prose built from the definition's own
  terms, set in scenarios outside Andy's pieces so no piece matches its own sentences. None
  shares a run of six words with the corpus. Andy chose the short form after a test: long
  examples (about 1,200 characters) separated hand-tagged pieces worse than short ones.
  - **The two risks the plan named are both handled.** Circularity, a piece matching its own
    excerpt and so earning the tag, by writing archetypes rather than excerpts. Unevenness, a
    concept favored for having an example, by giving every concept one before scoring.
  - **The measured limits still apply** (2026-10-27): a document is embedded in chunks of about
    5,000 characters, and a query is read only to about 2,500, so an example has to stay well
    under that. They run 334 to 479.
- [x] **The query recipe, decided by building three candidates** (2026-11-05). `score-spike.mjs`
  now takes `--recipe definition | example | combined`, and `tagger.mjs` can combine two anchored
  queries by mean or max (Andy's idea), one rule for every concept. Rounds 0 and 1 re-tag
  identically.
  - **Example queries score on a looser scale.** A short passage matches its concept's own
    document less closely than a definition does (median self-match 9.15 against 9.61), so the
    same 0.45 bar lets 31.9% of pairs through, against 13.6% for the definition and 14.0% for the
    combined query. That inflates any candidate that takes the example on its own.

  | | v1 | v2-combined | v2-mean | v2-max |
  |---|---|---|---|---|
  | Tags | 217 | 224 | 253 | 325 |
  | Share that are hand tags | 33% | 32% | 29% | 22% |
  | Sanity: documents (never naming it) | 19 (9) | 9 (1) | 8 (0) | 7 (0) |
  | Search: documents | 10 | 5 | 3 | 6 |
  | Cards shared with Andy's M3.1 pick, on the 35 pages v1 didn't win | 0.80 | 0.89 | 0.97 | 0.89 |

  - **v2 is v2-combined** (Andy): one query per concept, with the example inside it. It keeps v1's
    tag volume and hand-tag share and fixes Sanity. v2-mean came closer to the M3.1 picks but
    added 17% more tags, partly from the looser scale. Recalibrating the bands per recipe would
    remove that, and was held back so that M3.2 changes one thing.
  - **What changed from v1:** 31 of 73 documents keep their tags. Machine Readability went from 5
    documents to 10, User Interface Design 6 to 9, CMS 3 to 6; Sanity 19 to 9, Search 10 to 5,
    Content Modeling 16 to 13.
- [x] **Retag round 2, then M3.2** (2026-11-05). `tagsets/v2.json`, and `m3.2.md` with M3.1's
  columns, picks and notes carried forward. **65 of 73 pages are NEW.** Each page now keeps a
  Best row per round.
- [x] **M3.2 marked** (Andy, 2026-11-05). One v2 pick on every page, new notes on twelve.

  | Best list from | v0 Best (M3.0) | v1 Best (M3.1) | v2 Best (M3.2) |
  |---|---|---|---|
  | Embeddings | 24 | 10 | 5 |
  | Embeddings, same rules | 24 | 12 | 6 |
  | Hand tags | 13 | 8 | 5 |
  | Taxonomy v0 | 12 | 5 | 4 |
  | v1 | — | 38 | 10 |
  | v2 | — | — | 43 |
  | **Embeddings / taxonomy** | **48 / 25** | **22 / 51** | **11 / 62** |

  - **v2 won 40 of the 65 NEW pages (62%),** against v1's 36 of 68 (53%), and 3 of the 8 repeats.
    It beat v1's own list on 27 of the 38 pages v1 had won, Embeddings, same rules on 7 of 12,
    Embeddings on 5 of 10, Hand tags on 3 of 8 and Taxonomy v0 on 1 of 5. Only one page moved
    between lists already shown, against two in M3.1.
  - **By type,** embeddings / taxonomy picks went from 7 / 24 to 1 / 30 on articles, 4 / 3 to
    1 / 6 on case studies, 1 / 5 to 1 / 5 on notes and 10 / 19 to 8 / 21 on presentations.
    Case studies, which stayed with embeddings in M3.1, have flipped. Presentations remain the
    type embeddings serve best.
  - **The concepts M3.1 flagged recovered.** Win rates on NEW pages, by a tag v2 gave the page:
    Taxonomy 5 of 10 (M3.1: 2 of 11), Search 4 of 5 (3 of 10), Site Maps 5 of 7 (1 of 5),
    Sanity 4 of 9 (9 of 18). Content Discovery won 4 of 4, Structured Content 17 of 24.
  - **How much v2 changed barely mattered again:** it won 12 of 19 NEW pages where it swapped one
    card of the v1 pick, 22 of 34 with two, 6 of 12 with all three. Pages whose own tags changed
    from v1 went to v2 more often (29 of 43) than pages whose tags held (11 of 22).

  **Inputs for the next revision, from the marks and notes:**
  - **Presentation transcripts are not embedded,** by design: the projection in how.md covers a
    presentation's title, description, body text and highlights, because long transcripts
    "dominate the embedding, and Sanity drops everything past 10 chunks". Andy's note on *Language
    Arts for the Lizard Brain*, about 20,500 characters, mostly transcript: "These should be:
    they're rich content." Changing the projection changes every column, the embeddings baseline
    included, so it is an experiment of its own, not part of a vocabulary round.
  - **Pieces on cognition, language and meaning have no concept of their own.** *A Cognitive
    Sciences Reading List for Designers*, *Language Arts for the Lizard Brain*, *Language + Meaning
    + User Experience Architecture*, *Proust and the Squid* and *Information Design* are tagged
    with interface, interaction and design-principles concepts, the nearest practices. That is a
    vocabulary gap, and Andy's to judge.
  - **Sibling methods pull each other in.** *How to Choose Topics for Card Sorting* got Tree
    Testing, which it never mentions (Andy's note); their examples are close neighbors.
  - **Sanity misfires once,** on *Four Web Writing Style Guides from which to Borrow*, which never
    names it (Andy's note). v1 had nine such.
  - **Thin pieces get thin tags:** *Improv Consulting* (451 characters of text), *Information
    Design* (about 1,000) and *Proust and the Squid* (about 1,500).
  - **The crossing rule has a cost.** On *Taxonomy Management and use in Sanity Studio*, Andy notes
    that "the more relaxed category crossover rules really do match better content". That
    became the next step: see 3b.

### 3b. The crossing rule relaxed (v3)

Andy, 2026-11-05: v2 was the most successful round, so the crossing rule moves before another
variable is added, to get the best lists in place first.

- [x] **Why it moved.** By v2, 45 of 73 documents carry exactly three tags, so `TAXONOMY_CROSS`'s
  3 shared tags had come to mean IDENTICAL tag sets, and only 14 pages crossed. On v2's tags, 2
  shared tags at a ratio of 0.50 crosses on 34 pages (embeddings, same rules: 19; unrestricted
  embeddings: 53). The ratio has a cliff just above it: 2 of 3 tags shared is exactly 0.50, and
  at 0.60 crossings fall to 9.
- [x] **The rule:** `TAXONOMY_CROSS_RELAXED = {crossMinShared: 0.5, crossMinCount: 2, crossMax: 1}`
  in `baseline-columns.mjs`, beside `TAXONOMY_CROSS`, which stays the rule behind the Hand tags,
  v0, v1 and v2 columns. It equals `CROSS_RULE`'s provisional values in `lib/related.ts`.
- [x] **v3 is v2's tags under it.** `tagset.mjs`'s v3 pins v2's matrix and records the rule as
  `crossRule`; `m3-report.mjs` ranks each version's column under its own rule. So v3 changes one
  thing, and the related-terms round becomes v4.
- [x] **Against the M3.2 marks, before Andy judges v3:** 24 of 73 lists change. 16 are on pages
  where v2 was the pick, so they can only read as "different". On the 8 others, 3 move closer to
  the pick, 1 further, 4 stay level, and *Orchestrating the Mundane: Deskilling Language Models*
  now produces exactly the list Andy picked. Most new cross cards pair an article with a talk on
  the same subject, such as *Designing with Code* and *Content First Prototyping*.
- [x] **M3.3** (2026-11-05): `m3.3.md`, with M3.2's columns, picks and notes carried and the v3
  column added. **23 of 73 pages are NEW**; the 24th changed list repeats the one Andy picked.
- [x] **M3.3 marked** (Andy, 2026-11-05). He marked the 23 NEW pages only; an unflagged page keeps
  its v2 pick, which is the rule. **v3 was the pick on 15 of the 23.**
  - **Where v2 had been the pick,** v3 won 11 of 16. **Where another column had,** it won 4 of 7:
    three from v1, one from Embeddings, same rules.
  - **The cross card is what won it.** 21 of the 23 new lists add a card from the other
    category, and v3 won 13 of those. Most winners pair a talk with an article on the same
    subject, such as *Designing with Code* and *Content First Prototyping*.
  - **By type,** v3 won 9 of 11 presentations, 6 of 9 articles, 0 of 2 case studies and 0 of 1
    note. Presentations were the type embeddings served best, because the old rule rarely let a
    talk reach an article. On both case studies the new cross card displaced a sibling case
    study, and Andy kept v2: a hint, on two pages, that case studies relate best to each other.
  - **Andy's notes:** on *Ranked Lists of Related Content in Sanity Studio*, v3 is "*closer* to
    what was effective about the unrestricted embeddings match"; on *Taxonomy Management and use
    in Sanity Studio*, "better than other taxonomy versions ... but still not as good as
    unrestricted embeddings". Both kept their embeddings picks.
  - **The latest pick on each page**, v3's row where marked and v2's otherwise: v3 15, v2 32,
    v1 7, Taxonomy v0 4, Hand tags 5, Embeddings, same rules 5, Embeddings 5. Taxonomy 63,
    embeddings 10, against 62 and 11 after M3.2.

### 3c. Ties broken by genre and tag strength, not date (v4)

Andy, 2026-11-06: recency is an arbitrary ordering, and it shuts out older pieces that are as
relevant. Reversing the date order changes 24 of 73 lists on v3's tags, so it decides a lot.

- [x] **What else could break ties, without embeddings.** Per-page semantic scores were ruled out
  (Andy): bringing an embeddings query into the site's ranking is a new cost. Tested in a scratch
  copy of the ranker, proven identical to the real one, against v3. In the table, *closer /
  further / level* counts changed lists on the pages where Andy's latest pick is another column,
  and *shared* is the mean number of cards a list shares with his pick on the 30 such pages (v3:
  1.17). The picks are a proxy; M3.4 is the test.

  | Tie-break | Lists changed | Closer / further / level | Shared |
  |---|---|---|---|
  | Tag strength on shared concepts | 14 | 2 / 0 / 1 | 1.23 |
  | Concept-profile similarity (all 66 scores) | 16 | 2 / 0 / 3 | 1.23 |
  | Same genre first | 8 | 1 / 0 / 1 | 1.20 |
  | **Same genre, then tag strength** | **19** | **3 / 0 / 2** | **1.27** |
  | Same genre, then concept profile | 19 | 3 / 0 / 3 | 1.27 |

  None moved a list away from a pick. Genre-then-strength ties the best and reads only each
  document's own tag scores, which promotion stores as `topicScores` anyway; the profile version
  would need all 66 scores per document stored.
- [x] **v4 is v3 with that tie-break** (Andy chose it alone, over adding related links in the same
  round). `rankAcross` takes `tieBreak: 'genre-strength'`, off by default; a topic may carry its
  `score` and the page its `genreId`. The date still decides what neither separates, and the
  no-match fallback now puts the page's own genre first. Recomputed with the changed ranker, the
  v2 and v3 columns are unchanged on all 73 pages, and v4 equals the scratch result.
- [x] **M3.4** (2026-11-06): `m3.4.md`, M3.3 carried forward with the v4 column. **16 of 73 pages
  are NEW.**
- [x] **M3.4 marked** (Andy, 2026-11-06), the 16 NEW pages only. **v4 was the pick on 10 of 16**:
  all 6 where v3 had been the pick, 4 of 6 where v2 had been, none of the 4 held by v0, v1, the
  hand tags or Embeddings. Articles 4 of 7, presentations 6 of 9.
  - **The margins are small.** Two of the four notes say "better ... but just barely".
  - **A duplicate the taxonomy can't see** (Andy's note on *Boutique Knowledge Graphs: Building
    Smart Content At Any Scale*): *Conversations with Robots*, the article, and *Conversations
    With Robots*, the talk, both appear in one list: the same work in two formats. "Likely an
    issue outside of the taxonomy": a relation between an article and the talk it became, which is
    a content-model question, with a ranker rule to show only one of them.
  - **The transcript note is withdrawn** (on *Language Arts for the Lizard Brain*): that mismatch
    comes from the missing cognitive-science concepts, which Andy is adding.
  - **The latest pick on each page after M3.4:** v4 10, v3 9, v2 28, v1 7, Taxonomy v0 4, Hand
    tags 5, Embeddings, same rules 5, Embeddings 5. Taxonomy 63, embeddings 10, as after M3.3.

### 3d. The hierarchy round: Human Factors (v5)

Andy, 2026-11-06. M3.2's notes found that the pieces on cognition, language and meaning had no
concept of their own and were tagged with the nearest interface and design concepts. He added
**Human Factors** as a seventh top concept, holding **Cognition** and **Decision Making**, both
new, and **Mental Models**, moved from User Research with a new definition. The example on each is
a Claude draft that Andy reviewed and published.

- [x] **Tree Testing's second parent came and went.** Earlier the same day Andy gave it User
  Research first, then Evaluation. Re-tagged from v4's matrix with only that change, it was
  neutral: no tag changed, and one list (*WHO Knowledge Action Portal*) lost a card that reached
  it as a sibling under Evaluation. **The first parent is the one the tagger and ranker see.** By
  the time of the retag its only parent was Evaluation again, as in v4, so v5 carries no Tree
  Testing change. The co-tag on *How to Choose Topics for Card Sorting* comes from the scores, not
  the hierarchy, and is left for the manual audit.
- [x] **Examples for the three,** under revision 2's rules: about 400 characters, archetypes set
  outside Andy's pieces, no run of six words shared with the corpus (the longest was 4).
  - **Mental Models' pull toward the modeling pieces comes from the label and the corpus, not the
    wording.** The label and example alone, without the definition, still ranked *Content Modeling
    in the Age of Flying Cars* and *Domain Modeling for Structured Content* first. v4 had already
    put Mental Models on three such pieces. You can't define your way out of semantic similarity,
    again.
- [x] **Re-scored incrementally** (`score-spike.mjs --base`): Mental Models, Cognition and
  Decision Making, 3 queries, with every other concept's scores reused from v2's matrix. The
  control, Content Discovery queried again, was a median 0.0038 from its stored scores, which is
  the measured noise. Each re-scored concept's self-match landed in v2's range (median 9.74), which
  shows its document had been embedded with its published example.
- [x] **The first build, kept as `v5-first`: the right tags and a worse list.** 3 documents'
  tags changed. Cognition and Decision Making landed only on *A Cognitive Sciences Reading List
  for Designers* (0.60 and 0.54), so it shared no tag with anything in its category, and its list
  fell back to Recent. The pieces that should have shared Cognition sat at the bar, within noise:
  *Language Arts for the Lizard Brain* 0.446, *Language + Meaning + User Experience Architecture*
  0.449, and *Proust and the Squid* 0.362 against Discovery's 0.363 for its minimum tag.
  - **A concept on one piece gives the ranker nothing,** and it can displace the shared tags that
    were doing the work. A finding for the write-up.
- [x] **Cognition's example rewritten once** (Andy chose it over judging the first build). The
  first was set in procedures and safety; the corpus meets cognition through reading and
  language, so the second is set there, with fast, automatic reading set against slow reasoning.
  It is tuning toward the pieces the concept should catch, accepted because it corrected a
  mismatch in the draft rather than chasing the bar, and capped at one attempt.
  - **Predicted before it was published,** from one probe query and an in-memory simulation
    over v5-first's matrix. The real build matched the simulation's tags and lists card for card.
- [x] **v5** (`tagsets/v5.json`, Cognition re-scored once more from v5-first's matrix): 5
  documents' tags differ from v4.

  | Concept | Documents in v5 |
  |---|---|
  | Cognition | the Reading List 0.63, *Lizard Brain* 0.48, *Proust* 0.42 (its minimum) |
  | Decision Making | the Reading List 0.54 |
  | Mental Models | *Language + Meaning* 0.58, *Domain Modeling for Structured Content* 0.54, *Domain Modeling for Digital Information Designers* 0.50 |

  - **Mental Models lost two pieces:** *How to Choose Topics for Card Sorting*, to
    Discoverability by 0.003, and *Structured Content Design Workflow 2022*'s sixth slot, to User
    Research. In v4, Mental Models was User Research's child, and the specificity rule kept a
    parent off any document carrying its child; moving it freed User Research to compete.
  - ***Design for the Human Scale* stays just under:** Cognition 0.424, against Human Centered
    Design's 0.435 for its minimum tag.
  - **The cognition pieces now find each other.** The Reading List's list is *Lizard Brain* ⇄
    and *Proust*, and each of those shows the Reading List: short lists, but on topic.
  - **Human Factors is flat,** its children directly under a top concept, where siblings count for
    nothing. So a Cognition piece and a Decision Making piece connect only through a shared tag
    or a related link (Phase 4).
- [x] **M3.5** (2026-11-06): `m3.5.md`, M3.4 carried forward with the v5 column. 11 lists differ
  from v4's, and **9 of 73 pages are NEW**. The carried columns, Best marks and notes match
  M3.4 on all 73 pages, and the v5 column matches the ranker on all 73.
- [x] **M3.5 marked** (Andy, 2026-11-06), the 9 NEW pages only. **v5 was the pick on 5 of 9**:
  all four articles (*A Cognitive Sciences Reading List for Designers*, *AI Supported
  Auto-Categorization*, *Language + Meaning + User Experience Architecture* and *Structured
  Content Design Workflow 2022*) and the one case study, *Shoreline Community College*, which
  moves from Embeddings. It lost all four thin pieces: the notes *Proust and the Squid* and *Why
  Shortcuts Aren't the Road*, and the talks *Language Arts for the Lizard Brain* and *Improv
  Consulting*.
  - **Andy's notes:** on three of the four losses, that hand tags would help this thin content.
    On *Lizard Brain*, the withdrawn transcript note stays withdrawn, with "Could also benefit
    from hand tagging" added.
  - **The latest pick on each page:** v5 5, v4 10, v3 9, v2 26, v1 5, Taxonomy v0 4, Hand tags
    5, Embeddings, same rules 5, Embeddings 4. Taxonomy 64, embeddings 9.

  **What the marks show.** From a scratch analysis of the marked report, with nothing
  re-queried:

  - **The shipped configuration shows the pick on 40 of 73 pages,** and the share has risen
    every round (Where things stand). By type, v5 shows it on 19 of 31 articles, 4 of 7 case
    studies, 2 of 6 notes and 15 of 29 presentations. Of the other 33 pages, 8 hold an
    embeddings list and 25 an earlier taxonomy list or the hand tags, and 15 of those 25 share 2
    of 3 cards with v5.
  - **What embeddings still win is thin content.** 8 of their 9 remaining picks are on pages
    with 1,449 embedded characters or fewer: over 1,500 characters, embeddings win 1 page of 41;
    at or under, 8 of 32. Seven of the nine are talks, whose embedded text is a description and
    highlights; *Lizard Brain*'s 19,410-character transcript is seen by neither method. And 4 of
    the 6 pages on a minimum tag are embeddings picks.
    - **The mechanism:** embeddings degrade gracefully, because a short description still ranks
      every piece. The tagger needs enough text to clear a bar, and below it a page gets one weak
      minimum tag that its whole list hangs on. So the taxonomy needs a person exactly where the
      text is thinnest, which is what Andy's notes say.
  - **On the thin pages v5 lost, its cards were right but too few.** *Proust* and *Lizard
    Brain* each got one card, the Reading List, and Andy's pick includes it both times, along
    with *Language + Meaning* and *The Trouble with Systems*.
    - ***Language + Meaning* is the missing link.** It scores 0.481 for Cognition and lost its
      third band-1 slot to User Experience Design at 0.486, within noise; band 2 wants 0.54. The
      cap on tags per document is a precision choice, and here it costs recall.
    - **A short list wins only against a wrong one.** The Reading List's two cards beat a full
      list of general IA pieces; one right card lost to three.
    - **Two remedies, with different owners:** an author tag at the audit, or embeddings
      filling empty slots ("Combinations worth testing" in value-add.md), which carries the
      per-page query cost that ruled out the embeddings tie-break.
  - **A tag's quality reaches every page that can reach it.** Proust's old minimum tag,
    Discovery, had put it on *Shoreline Community College*'s list; with it gone, Shoreline moved
    from embeddings to v5, the case study type embeddings held longest. The same stray tag had
    paired Proust with *Why Shortcuts Aren't the Road*, another thin note, and Andy kept that
    list. Weak tags on thin pieces connect partly by luck.
  - **Where a concept sits changes tagging, not only ranking.** Moving Mental Models out from
    under User Research let User Research onto *Structured Content Design Workflow 2022*, since
    the specificity rule had kept the parent off. All three NEW pages that Mental Models' move
    touched went to v5. For value-add.md's governance claim: in this pipeline a structural edit
    re-tags as well as re-ranks.
  - **The one long piece embeddings still win:** *Delivering Information Architecture*, with
    six specific tags. It lost Information Architecture (0.633, a hand tag) to Site Maps under
    "more specific wins", v0's IA problem surviving on one page.
  - **A work list for the audit (Phase 5):** the six pages on a minimum tag, the thin talks,
    Cognition on *Language + Meaning*, and Information Architecture on *Delivering Information
    Architecture*.

### 4. Taxonomy revision 3: related terms

**Deferred** (Andy, 2026-11-06) until the core taxonomy is solid and vetted in use; see "The
experiment is closed". What was explored stays below for when it is picked up.

- [ ] Add `skos:related` links. None of the 73 concepts uses it today.
- [ ] Retag round 3 as **v6**, under the relaxed crossing rule and v4's tie-break, then **M3.6**
      (renumbered 2026-11-06: the hierarchy round took v5)

**Explored before v4** (2026-11-06), recorded because most of it did not work:

- **The goal** (Andy): explicit non-hierarchical connections that surface meaningful but otherwise
  unrealized connections between resources. A working test for a link: would someone reading a
  piece tagged only A want one tagged only B? Pieces about both already carry both tags.
- **Standard practice:** `skos:related` is symmetric, not transitive, and SKOS forbids it along a
  hierarchy path. The thesaurus standards (ISO 25964, Z39.19) ask that every associative link be
  justified, and name over-linking as the failure. Siblings may be linked where meanings overlap.
- **Siblings depend on the ranker:** siblings under a mid-level parent already count, as the
  sibling tier; siblings directly under a TOP concept count for nothing, by design. A link between
  those is not redundant.
- **What the picks showed:** of 55 cards in Andy's picks missing from v3's lists, 29 already share
  a tag with the page and 19 are reachable only through a pair the hierarchy doesn't connect. Of
  51 cards he passed over, 32 beat his picks on a higher shared ratio and 13 won a date tie.
- **A weighted partial match** (a related pair as part of a shared tag) was built into the ranker
  and simulated, then taken out again. With 12 links mined from the picks, weight 0.5 changed 11
  lists and moved them 2 closer, 2 further: a link credits every piece on the other side, not the
  card that was wanted. Weighting rare shared concepts more heavily has no signal either: the
  cards he passed over and the ones he wanted share equally common concepts.
- **Related in other roles,** on 24 links drawn from the concepts' meaning (`practice → outcome`,
  `tool → practice`, `method → practice`, and across branches): as a tier after shared tags or as a
  "nearer" match, about neutral (shared 1.20); weight 0.5 worse (1.13); a tier on top of v4's
  tie-break, the best measured (5 / 1 / 4, shared 1.30), at 28 NEW pages. So round 3 builds the
  tier role, on v4's tie-break.
- **Expect more after Andy's hierarchy work:** the missing concepts for cognition, embodiment and
  natural language, and the Card Sorting / Tree Testing overlap, both produce mis-tags, and a link
  spreads whatever the tags say.

### 5. Manual audit

With the experiment closed, the audit is better done in production after promotion, as ordinary
tagging with "Suggest topics": author tags are then written where they live, and nothing has to
be carried across datasets. Claude's suggestion (2026-11-06), not yet decided; the list below is
the lab plan it would replace. The **`topicScores` field** this phase waited on is built (Phase 6
→ The tagger), and M3.5's marks left a work list (Phase 3d → M3.5 marked).

- [ ] **Write the chosen tag set into the lab,** with a backup first and a dry run first. This is
      where the tags first reach the dataset.
- [ ] Andy reviews the tags in the lab Studio for ones the tagger missed. Those become author
      tags, which are never bumped.
- [ ] **M3.7**, from the tags in the dataset (renumbered: M3.3 went to the crossing rule, M3.4
      to the tie-break and M3.5 to the hierarchy round)

### 6. Promotion

**Nothing in this phase starts until Andy explicitly gives the go-ahead** (see Ground rules). It
is where the results are rolled into the live site, and it is the first time this project
touches `production-26` or the site's pages.

- [ ] **Andy's go-ahead**
- [ ] **Move the concept and scheme documents into `production-26`,** then re-run the tagger there
      and write the tags and `topicScores` through `lab-api.mjs --allow-production`, with a backup
      first. See "Where the experiments run" → Cost.
      - **The write step isn't built yet:** the research pipeline scores and tags the corpus but
        writes nothing. It needs a backup, a dry run that shows each document's change, and one
        transaction, which the deploy workflow collapses into a single build.
      - **Check the floor once,** against production's own scores, before the first write. 4.9
        was frozen from the lab's spike, and production has its own embeddings index.
- [ ] **Turn the tagger on in production:** remove `isLab` from the action's registration in
      `studio/sanity.config.ts`, then deploy the Studio, which deploys the `topicScores` field
      too. Its concepts must carry definitions and examples by then, or it refuses to run.
- [ ] **Cross-category ranking: the wiring.** The insight and presentation pages move to
      `rankAcross`. `RelatedBand.astro` gets the new labels and links each card to its own
      collection. The old branch rule and the `parent` projection are then removed.
      - **`CROSS_RULE` takes the research's final rule,** from `baseline-columns.mjs`, and its
        comment is rewritten to match. Since v3 that is `TAXONOMY_CROSS_RELAXED`, which already
        equals `CROSS_RULE`'s values, so only the comment would change.
      - **It is already written:** `git stash list` shows it as "recommendations-research:
        cross-category wiring of pages and RelatedBand, for promotion (2026-10-28)". It changes
        four files: `RelatedBand.astro`, both `[slug].astro` pages, and a comment in
        `lib/related.ts`. On 2026-10-28 it passed `astro check`, the build, `links`, `validate`
        and `a11y`, and all 73 built pages matched the ranker exactly. Re-verify after
        applying it: the corpus and `CROSS_RULE` will have moved.
      - **Removing the old rule breaks three research scripts.** `measure.mjs`, `m3.mjs` and
        `cross-dryrun.mjs` import `branchForType`, `genresForBranch` and `rankRelated`, which are
        the rule the committed M1, M2 and first M3 reports measured. The proposal is a frozen copy
        in this folder: the old rule is `rankAcross` with the eligible genres as the home set
        and crossing off, so the copy reuses the real scorer and the reports stay reproducible.
        Andy's call. **Decided otherwise (Andy, 2026-11-21):** no frozen copy. The scripts stop
        running, and each one's header names `b4e85bd`, the last commit with the old rule
        (stream-2-ranker.md → Decided at the start, 3).
- [ ] **Merge to `main`**, which deploys. Andy's call, as always.

### The tagger: built 2026-11-12, lab only

The stopgap Andy asked for on 2026-11-06, until tagging moves into the Taxonomy Manager. Each
file's header holds its reasoning.

| File | What it is |
|---|---|
| `studio/tagger/tagger.ts` | The tagger, moved from this folder. All ten research tag sets re-ran through it identically |
| `studio/tagger/score.ts` | The Topic concepts, each concept's query text, and one document scored against every concept |
| `studio/tagger/propose.ts` | Pure: the result merged into `topic` and `topicScores`, and `exclusionPatches` |
| `studio/tagger/SuggestTopicsAction.tsx` | The "Suggest topics" action: confirm, score, review, apply to the draft |
| `studio/tagger/TopicsInput.tsx` | Topics' input: records a removal or an add-back in `topicScores` as it lands |
| `studio/schemas/objects/topicScore.ts` | The `topicScores` entry, the collapsed "Tagger" fieldset, and the field |

**Measured and proven:**

- **Query text** built by `score.ts` matches the text v5's matrix saved, on all 68 concepts, as
  does every concept's first parent.
- **Narrowing a query changes no score.** The Studio scores one document and the concept's own
  document; the research scored the whole corpus. For the Reading List against Cognition, the
  raw scores were identical in both queries and in v5's matrix: 7.885244, and 9.654434 for the
  concept's own document.
- **End to end,** on the Reading List in the lab: 68 queries in 3.0 s. Scores were within 0.002
  of v5's matrix, which is run-to-run noise, with the same tags in the same slots.
- **Drafts are embedded in their own right,** so a piece can be tagged before its first publish
  and published once.
- **The merge and exclusion rules** pass 14 checks on made-up documents: every row of
  `propose.ts`'s table, keys kept, pruning, the minimum tag, and the next run reading a recorded
  mark. Andy tested the action and the exclusion in the lab Studio.

**What a run costs:** one semantic search per Topic concept, 68 today, against the
organization's monthly quota. The Free plan allows no overage.

**Not built, on purpose:** a corpus retag in the Studio, which stays a script (see the checklist
above), and automation by a Sanity Function. `@sanity/ui` is not added either: adding it
re-resolved other packages in the shared lockfile when tried on 2026-10-22, so the dialogs use
the Studio's own.

### The reverse direction: querying from the document (2026-11-14 to 11-19)

**Why.** Tagging one document costs one semantic search per concept, 68, and the organization's
quota is 1,000 a month: November reached 867 by the 12th, 340 of them five test runs of "Suggest
topics". One search per concept scores EVERY document at once, so a whole corpus costs the same
68 as a single piece; the expense is tagging one document at a time. Andy's proposal: when the
document is what changed, let it be the query.

**One search is one read.** The organization's `embeddings-reads` metric counts one per semantic
search (November 6 showed 20, matching that day's queries exactly). It counted past 1,000 on
2026-11-17 and refused nothing, so the quota is not enforced in real time on this plan.

**The chunking** is Andy's design: sections at headings, split at paragraph breaks, short
neighbors packed together, 2,000 characters a query (`reverse-shortlist.mjs` says why). The
corpus needs 302 queries in all: a median of 1 per document, at most 20, never above 68. A
single query reading only a document's opening would miss 71% of the corpus text; the forward
direction misses none, because a document is embedded in chunks.

**What it found** (`reverse-report.mjs` over `scores/reverse-recommendations-lab-20261120T003633Z.json`,
a re-run that reproduced the first run's figures within one document):

| Combining a document's chunks | Deepest v5 tag: median / 90th pct / worst | v5 exactly at K = 10 | K = 15 | K = 20 |
|---|---|---|---|---|
| Best chunk | 5 / 13 / 27 | 59 of 73 | 68 | 69 |
| **Mean of the best two** | 5 / 14 / 21 | 61 | 68 | **72** |
| Mean of all chunks | 5 / 14 / 42 | 60 | 66 | 69 |
| First chunk only | 5 / 21 / 63 | 57 | 63 | 64 |

- **The reverse direction is good for recall, not for scores.** On the 37 single-chunk
  documents, forward and reverse scores correlate at a median of 0.93, but the offset between
  them runs from −0.38 to +0.26, and reverse scores alone give v5's exact tags on only 9. A first
  test on three documents had looked better, at 2 of 3, and was luck.
- **The offset follows the document's own self-match** (correlation 0.77), which every reverse
  query returns for free. A possible correction, not built.
- **So: shortlist, then score forward.** The sections pick about 15 concepts, and those score
  the document forward, narrowed to it, which gives exactly the full query's scores (checked
  2026-11-12). About 16 searches for a typical piece, at most about 40, against 68.
- **Reading only the opening is the weakest row.** Evidence for chunking over a synthetic
  summary, worth keeping for the article.
- **The misses are mostly weak tags:** a fifth or sixth tag in the second band. One, Sanity on
  *Four Web Writing Style Guides*, is a tag Andy called a misfire in M3.2.
- **Shared forward checks make batches cheap,** since one concept query scores every document in
  the batch; once a batch's shortlists cover most of the 68 concepts, the full pass is cheaper.

**The first run's raw results were lost** with the scratchpad on 2026-11-19, before they were
saved: the risk had been named two turns earlier and not acted on. The scripts were rebuilt here
and re-run, which also proved them.

## Specs

### Cross-category ranking

- **Categories.** **Insights** covers `article`, `caseStudy` and `note`; **Presentations** covers
  `presentation`.
- **A behavior change.** Notes and articles now relate to each other; today notes relate only to
  notes. Genre still decides which category a document belongs to.
- **Home category first,** ranked as it is now: tiers, union-normalized, lexicographic.
- **Crossing is a strong match only.** A candidate from the other category enters only if all of
  these hold:
  - it shares at least `crossMinCount` tags, and never fewer than one
  - its shared ratio is at least `crossMinShared`
  - it outranks the weakest home card it would displace, strictly
  - at most `crossMax` cross cards are shown

  All of these are adjustable.
  - **The research used `TAXONOMY_CROSS`** in `baseline-columns.mjs` through v2: `crossMinShared`
    0.40, `crossMinCount` 3, `crossMax` 1, calibrated on tag set v0 (Andy, 2026-10-28). **From v3
    it uses `TAXONOMY_CROSS_RELAXED`:** 0.50, 2, 1 (Andy, 2026-11-05; Phase 3b).
  - **The pages will read `CROSS_RULE`** in `lib/related.ts`. It keeps its provisional values
    (0.5, 2, 1, from 2026-10-27) until promotion, and its comment there is out of date until
    then too.
- **Labels.**

  | Page | No cross cards | With a cross card | Fallback |
  |---|---|---|---|
  | Insight | "Related Insights" | "Related Insights & Presentations" | "Recent …" |
  | Presentation | "Related Presentations" | "Related Presentations & Insights" | "Recent …" |

- **A card links to its own collection.** That reverses the reasoning recorded on `RelatedBand`'s
  `basePath` prop, which says a link's collection is "a fact about the PAGE". The comment changes
  with the code.
- **The ranking logic is on this branch; the page wiring waits for promotion.** No page uses
  `rankAcross` until phase 6, so the research can run it in memory without changing what any
  page shows.

### Tagger

- **Scope.** The Topic scheme only, in the `topic` field of the four types. Genre is not touched.
  Top concepts are never candidates.
- **Score.** One query per concept, 68 today, or only the new and changed ones (see Incremental):
  - **query:** the concept's `prefLabel`, `definition` and `scopeNote`, with examples added from r2
  - **result:** every document is scored against it
  - **normalization:** the anchored scale, `(score − 4.9) / (self − 4.9)`, where `self` is the
    concept's own document in the same query. 0 means as unrelated as anything in the corpus; 1
    means the concept's own words. The floor of 4.9 is frozen from the spike, so the scale
    doesn't depend on the corpus. Re-derive it if Sanity updates its model.
  - **cache:** the full concept × document matrix is kept per round as a local file. It is the raw
    material for trend charts, and lets a freed slot be refilled without re-querying.
- **Select per document.** The configuration is adjustable:

  ```js
  {floor: 4.9, bands: [{count: 3, min: 0.45}, {count: 3, min: 0.54}], minimum: 1, ruleOfN: null}
  ```

  The round-0 values were set by Andy on 2026-10-26, from the spike's threshold table:
  ≥ 0.45 is about the top 15% of pairs, and ≥ 0.54 about the top 5%.

  - **Slots run in band order, at most six.** Author tags (in `topic` with no score) take slots
    from the front and are never bumped. Any band-1 slots left take auto tags scoring ≥ 0.45;
    band-2 slots take auto tags scoring ≥ 0.54.
  - **Minimum one tag.** A document that clears no band and has no author tag still gets its
    single best concept, even below 0.45. It is an ordinary auto tag: its stored score shows it was
    below the bar, and a later candidate that clears a band bumps it.
  - **Auto tags** fill the remaining slots by score.
  - **A new candidate** above the threshold takes a free slot, or bumps the lowest auto tag it
    outscores.
  - **No concept beside its own broader.** An auto tag may not be the parent or a child of any
    other tag on the document, author or auto. Author tags are exempt from removal, so a pair
    containing one can survive. When two auto candidates both qualify, **the more specific one
    wins**.
    - **"Both qualify" means both earned a slot on score** (proposed 2026-10-28; Andy to
      confirm). The broader gives its slot up and the next candidate takes it. The other reading
      is that any narrower concept clearing 0.45 evicts its broader, whether or not it would have
      had a slot. That reading changes 12 of 73 documents in v0, and often for the worse: it
      takes *Information Architecture* off *What's It Like to Work with an Information
      Architect?* for *User Interviews*, because a child of IA cleared 0.45 without earning a
      slot.
  - **Rule of N:** a configurable variant, off in round 0. With it on, N or more qualifying
    children of one broader concept give way to the broader concept.
- **Incremental.** When a concept is added or changed, only that concept is re-queried, and the
  bump rule is applied per document.
  - **Re-querying only what changed is built** (`score-spike.mjs --base`, 2026-11-06), with a
    control query that checks the reused scores still hold. The bump rule is not built.
- **Output: a tag-set file per version,** `tagsets/<version>.json`, holding each document's tags
  with their scores. The ranker and M3.n read it in memory. Rounds 0–3 never write to the dataset.
- **Write, at phase 5 and promotion only.** Through `lab-api.mjs` under
  `sanity exec --with-user-token`, so no token is handled. A backup comes first and a dry run
  before any write.
- **In the Studio** (2026-11-12): "Suggest topics" tags one document and writes its draft, for
  review and one publish. It reads author tags and exclusions by the rules in
  `studio/schemas/objects/topicScore.ts`. See Phase 6 → The tagger.

### M3.n evaluation reports

- **File and order.** One file per run, `m3.n.md`, readable in Obsidian. Resources are grouped by
  category (Article, Case Study, Note, Presentation) and sorted alphabetically within each group.
- **One section per resource,** with a **NEW** flag when the newest column offers a list Andy has
  not seen for that resource (Andy, 2026-10-29).
  - **"New" ignores order.** v1's three cards are compared as a set with every earlier column's
    set on that page. If they match any of them, the page is not flagged, because Andy has
    already judged that list.
  - **Only flagged pages are re-evaluated,** and only against the Best already chosen: is the new
    list better? An unflagged page keeps its mark as it is.
  - **Best is the best of the lists shown, not of every possible list** (Andy, 2026-11-03). So a
    high NEW count is not a bad sign in itself: each flagged page is a chance for the new version
    to beat what was there.
  - **Each flagged page sets the new list against the latest pick,** in a quoted line above its
    table: the cards it adds, drops and keeps (Andy, 2026-11-03). In M3.1, v1 adds 1 card on 8
    pages, 2 on 37 and all 3 on 22; on one page it returns a single card the pick already had.
    The latest pick is the newest earlier Best row with a mark, so a page left unmarked in one
    round is compared with the round before.
  - **This replaces the earlier CHANGED flag,** which flagged any difference from the previous
    run. That would have sent Andy back to lists he had already judged in another column.
- **The table.**
  - **Columns:** `Embeddings | Embeddings, same rules | Hand tags | Taxonomy v0 | v1 | …`.
  - **The two embeddings columns** are the baseline: no taxonomy at all.
    - **Query text:** each page's title, summary and the opening of its body, so the search
      approximates a comparison of whole documents. GROQ has no direct way to compare two
      documents.
    - **Embeddings:** the unrestricted top 3, meaning what embeddings alone would show.
    - **Embeddings, same rules:** the taxonomy ranker's category policy, applied to semantic
      scores. Home-category documents come first, and a document from the other category enters
      only if it is strong. "Strong" is measured as in the spike: the page's own document goes in
      the query as the yardstick, scores are anchored to it, and a crossing document must clear
      `crossMinSemantic` and outscore the weakest home card. This column isolates what the
      vocabulary adds.
    - Both are computed once and cached, since the experiment changes no content text.
  - **Header cells:** each gives that column's agreement with the column before it, as `(agree n/3)`.
  - **Rows:** three for the cards, then **one Best row per round,** then a **Notes** row (Andy,
    2026-11-03). M3.n has `v0 Best` to `vn Best`. The earlier rows are carried forward with their
    picks grayed to ☑️, so the report keeps a record of every round's judgment, and the `vn Best`
    row is left empty for Andy's ✅. M3.0's single **Best** row counts as `v0 Best`. The summary
    table counts each earlier round's picks per column.
  - **Unchanged columns:** a column identical to the previous version reads "no change".
- **Carry-forward.** Every run carries the earlier columns forward, with their Best marks and notes.
  - **The earlier columns are read from the marked report, not recomputed.** Revision 1 changes
    the lab's Topic scheme, and possibly its hand tags, so recomputing the Hand tags or v0 column
    against the lab would rewrite what Andy judged. M3.1 is `m3.0.md` as marked, plus the v1
    column.
  - **Cards are matched by title**, which is unique across the 73 pages (verified 2026-10-29).
    Obsidian pads the tables when it saves them; a test parse of the marked `m3.0.md` read every
    mark.
- **Comparisons that skip a run** go below the table, and only for truly interesting cases.
- **The generator** (`m3-report.mjs`, built 2026-10-28):
  - **It never overwrites a report**, since a report holds Andy's marks. `--overwrite` is only for
    one he hasn't touched.
  - **`--out <file>` writes elsewhere,** for checking that a code change reproduces an existing
    report. Added 2026-11-05, after such a check regenerated the marked `m3.2.md` in place and it
    had to be restored from git. A regenerated report differs from the committed one only in its
    "Generated" date, which is UTC.
  - **Carry-forward is built** (2026-11-03). `m3-parse.mjs` reads the previous report back, and
    the generator copies its columns, Best marks, notes and tag lines, then computes only the
    newest column. It checks the previous report's column names and page ids before copying.
  - **NEW sits in the heading,** as "— NEW", so the outline and search find it, and the summary
    lists the flagged pages by category. A page that isn't new names the column its newest list
    repeats, in that column's header ("same as Embeddings"). The summary table gains a Marked
    Best count per column.
  - **The extract script is not built yet.** It will use `m3-parse.mjs`.
  - **Each page's id sits in an HTML comment under its heading,** hidden in Obsidian, so the
    parser can find a page whatever its title.
  - **"No change" applies within the taxonomy versions** (v0 against the hand tags, v1 against
    v0, and so on). The embeddings columns always list their cards.
  - **Prose is one line per paragraph,** not wrapped, for Obsidian.
- **Extract script.** It parses every `m3.*.md` into one table of resource, version, agreement, best
  and note, for charting trends.

## Open questions

Each has a default in place until Andy says otherwise.

- **How a later round retags: from scratch, or by bumping.** Rounds 1–3 re-score only the
  concepts that changed. The tagger can then re-run from scratch over the updated matrix, or
  apply the spec's bump rule to the previous tag set.
  - **They differ when a changed concept's score drops.** From scratch, the tag goes if it no
    longer earns its slot. A bump never removes a tag, so the old one stays until something
    outscores it.
  - *Default:* from scratch. It is deterministic, and it is what promotion does ("re-run the
    tagger there"). The bump rule matters for the live site, where content and concepts change
    one at a time, so it can be built for the Taxonomy Manager prompt rather than for the
    simulation.

- **When to try the rule of N.**
  - **The case for it:** it frees slots, and it says "this is about the area as a whole".
  - **The cost:** a document tagged with the broader concept matches documents tagged with one of
    its children only at the "nearer" tier, not "shared".
  - *Default:* try it only if slot crowding shows up in the M3 evaluations, meaning several
    children of one broader concept filling most of a document's tags.
- **Facets and the broader concepts.** This came up in the 2026-10-26 measurement. It is not
  caused by the rule above.
  - **The problem:** facets filter on direct tags with no roll-up (`docs/urls-and-filtering.md`),
    so a mid-level chip lists only documents tagged with it directly. *Content Strategy* has 0
    such documents, against 26 tagged only with one of its children. *Information Architecture*
    has 6 against 20.
  - **How the rule bears on it:** dropping parents keeps that gap where it is. Only inference at
    the facet would close it.
  - **Status:** out of scope for this experiment unless Andy brings it in. It belongs to the URL
    contract, which is Andy's, and the promotion step is where it would come up.
