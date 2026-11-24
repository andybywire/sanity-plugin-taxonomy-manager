> **Archived copy.** From `andybywire/andyfitzgeraldconsulting`,
> `docs/recommendations-research/what-goes-where.md`, at commit `ae73f98` (2026-11-24). Paths and links in it refer to
> that repository, where the whole research folder stays in git history at that commit.

# What goes where: plugin, article, site

*2026-11-12. A first sort of everything the research built or learned, toward the Taxonomy Manager
and an article on related resources with tags. The algorithm itself is drawn in
[related-algorithm.md](related-algorithm.md).*

Four destinations:

| Destination | What belongs there |
|---|---|
| **Plugin** | Taxonomy Manager features in the Studio, for any project with SKOS concepts and documents tagged with them |
| **Companion** | Generic, but not Studio code: what runs in a front end at build, or what is documentation, such as a recipe or the starter prompt |
| **Article** | What a taxonomy contributes next to embeddings, and how to build it: findings and method |
| **Site** | This site's choices, and values calibrated on this corpus and this embedding model |

**Many parts split along one line: the mechanism generalizes, and the numbers don't.** The
bands, the floor and the crossing rule are good plugin or companion options, and 0.45, 4.9 and
"2 shared tags at a ratio of 0.5" belong to this site.

## The parts

### Vocabulary

| Part | Goes to | Note |
|---|---|---|
| Genus–differentia definitions | Article, Companion | A finding, and the core of the starter prompt |
| Short archetype examples, about 400 characters, set outside the corpus | Article, Companion | Short beat long; an archetype, not an excerpt, avoids a piece matching its own words |
| Every concept needs a definition and an example before tagging | Plugin, Article | A readiness check in the Taxonomy tool; `score.ts` already refuses without them |
| A copy check: no long run of words shared with the corpus | Plugin (maybe) | The guard against circularity, done by hand here |
| No per-concept rules in the tagger | Article, Plugin | A principle, and a design constraint: every setting applies to every concept |
| First parent, or every parent | Plugin, Article | SKOS has no "first" broader; the plugin should make this an explicit option |
| The vocabulary itself: Topic, Genre, Human Factors | Site | |

### Tagging

| Part | Goes to | Note |
|---|---|---|
| Concept as the query: one semantic search per concept, scoring the document and the concept's own document | Plugin | The direction five rounds of evaluation validated |
| The query recipe: label, definition, scope note and example in one query | Plugin, Article | The default; one combined query beat two combined by mean or max |
| The anchored scale, with the concept's own document as the yardstick | Plugin | The mechanism. The floor of 4.9 is Site, so the plugin needs a calibration step |
| Bands and slots | Plugin | Configurable. The values, 3 at ≥ 0.45 and 3 more at ≥ 0.54, are Site |
| The specificity rule: never a concept beside its own parent | Plugin | With "both earned a slot" as the reading |
| At least one tag | Plugin | An option; turning it on is Site's choice |
| Author tags kept and never bumped | Plugin | |
| Exclusions recorded at removal | Plugin | Simpler inside the plugin: see below |
| `topicScores`: concept, score, date, excluded | Plugin | Ship the object type and a field helper, as the filters are shipped |
| "Suggest topics": confirm the cost, review, apply to the draft | Plugin | |
| Re-scoring a concept across documents when it changes, with a drift control | Plugin or Companion | A Taxonomy tool action, or a script; automation by a Function later |
| One semantic search per concept per run, and its quota | Plugin, Article | Shown in the action; a cost the article should name |
| Drafts are embedded, so a piece can be tagged before its first publish | Plugin, Article | |
| The plugin's current recommendations, which score the document's text against concepts | Plugin (a decision) | One query instead of 68, but uncalibrated, so the bands don't transfer |

### Ranking

| Part | Goes to | Note |
|---|---|---|
| Three tiers from SKOS structure: shared, nearer, sibling, with top concepts excluded | Companion, Article | Pure, framework-free, and runs at build |
| Each tier divided by the size of the two tag sets' union; ranked lexicographically | Companion, Article | |
| The tag-strength tie-break | Companion, Article | Needs the stored scores, so it depends on the plugin's field |
| The genre tie-break | Site; Article in general form | "A second scheme, for form, to break ties" is the transferable idea |
| Categories as a scheme's subtrees, crossing only on a strong match | Companion | The mechanism. Insights and Presentations, and 0.5, 2 and 1, are Site |
| The Recent fallback, three cards, labels, `RelatedBand` | Site | |
| No semantic search at build; ranking reads stored tags | Article, Companion | The cost argument, and a design rule |

### Evaluation

| Part | Goes to | Note |
|---|---|---|
| Lists side by side, judged by a person, one Best per round, NEW flags, carry-forward | Article | The method. The scripts stay here as the record |
| Two embeddings baselines: unrestricted, and under the same category rules | Article | What makes the comparison fair |
| Simulated tag sets ranked in memory; a pure ranker; a lab dataset | Article | |
| The stricter measure: how often a configuration shows the pick | Article | The headline: v5 40 of 73, embeddings 6 |
| The limits: one judge, labeled columns, tuned on the pages judged | Article | And the blind spot-check, still pending |

### Findings

All Article. Each has its evidence in plan.md:

- **Vocabulary work moved the result more than ranking rules did.** Pages where the
  configuration shows the pick went from 26 at v2 to 40 at v5.
- **Definitions and examples are working text,** not documentation.
- **You can't define your way out of semantic similarity:** Sanity, and Mental Models.
- **Rules belong in the vocabulary, not in code.**
- **Form and topic are different vocabularies.** Embeddings blur them.
- **Crossing categories needs a rule you can state.**
- **Calibrate on the tags you'll actually have.**
- **A concept on one piece gives the ranker nothing.**
- **Thin content is where embeddings still win,** and where people should tag.
- **A tag's quality reaches every page that can reach it.**
- **Where a concept sits changes tagging, not only ranking.**
- **Some relations should be stated, not inferred:** the same work in two forms.
- **Spend semantic searches once, at tagging,** and keep the scores as metadata a person can
  review.
- **A hierarchy helps only what infers from it:** the ranker does, the facets don't.

## For the Taxonomy Manager

In the order they depend on each other:

1. **The scores field.** The `topicScores` object type and a field helper. Everything else writes
   it.
2. **A tagging action for any concept field,** configured with the query fields, the bands, the
   floor, the minimum and the scheme.
3. **Author tags and exclusions inside the plugin's own input.** The plugin owns the hierarchy
   input and its browse dialog, so it can write the mark in the same transaction as the removal
   or the add. This site had to watch the value of Topics from outside instead, because the
   dialog writes with its own client.
4. **Concept readiness in the Taxonomy tool:** which concepts lack a definition or an example,
   and so can't be used for tagging.
5. **Re-scoring a concept across documents** when its text changes, with the drift control.
6. **A floor calibration step** for each dataset, since the floor depends on the corpus and the
   embedding model.

## Decisions for Andy

1. **Where the ranking ships.** It is generic but runs in a front end, not the Studio. A recipe
   in the plugin's documentation, a separate small package, or an entry point in the plugin's
   own package, which would bring its Studio peer dependencies into a front end. I'd start with
   the recipe and make it a package if anyone asks.
2. **The plugin's current recommendations:** replace them with the calibrated tagger, offer both,
   or calibrate the reverse direction.
3. **One scores field per concept field, or one for the document.** A document can carry several
   concept fields, Topic and Genre here, so a generic version needs either `<field>Scores` or
   entries that name their field.
