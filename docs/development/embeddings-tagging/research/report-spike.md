> **Archived copy.** From `andybywire/andyfitzgeraldconsulting`,
> `docs/recommendations-research/report-spike.md`, at commit `ae73f98` (2026-11-24). Paths and links in it refer to
> that repository, where the whole research folder stays in git history at that commit.

# Score spike: how Sanity semantic scores behave across concepts

Matrix `scores/spike-recommendations-lab-20261026T235419Z.json`: 73 documents × 55 Topic concepts from `recommendations-lab`, taken 2026-10-26T23:54:19.530Z. Query text per concept: prefLabel, definition, scopeNote. 207 hand tags on 71 documents serve as the benchmark, which is incomplete; see the header of `spike-report.mjs`.

## Raw scores are not on one scale

| across the 55 concepts | lowest | median | highest |
|---|---|---|---|
| self-match | 8.85 | 9.52 | 9.84 |
| best document | 6.74 | 7.62 | 8.85 |
| median document | 5.92 | 6.49 | 6.92 |
| worst document | 4.98 | 5.61 | 6.10 |

Every concept has a floor well above zero, and the floor moves from concept to concept. A raw cutoff that suits one concept is below the worst document for another.

## Which normalization lets one threshold serve every concept

Within any one concept, every candidate ranks documents identically, so the semantic signal itself is the same for all of them: mean per-concept AUC **0.777** over the 43 concepts that have hand tags. The candidates differ only in how well they line the concepts up against each other.

| normalization | global AUC | recall@3 | recall@4 | recall@6 | corpus-independent |
|---|---|---|---|---|---|
| self-anchored | 0.774 | 0.42 | 0.46 | 0.51 | no |
| z-score | 0.767 | 0.30 | 0.37 | 0.45 | no |
| raw | 0.767 | 0.41 | 0.46 | 0.50 | yes |
| percentile | 0.765 | 0.29 | 0.34 | 0.43 | no |
| anchored | 0.765 | 0.40 | 0.45 | 0.51 | yes |
| self ratio | 0.762 | 0.37 | 0.43 | 0.51 | yes |
| min-max | 0.747 | 0.26 | 0.32 | 0.40 | no |

### Thresholds under "raw"

Each row is a cutoff, chosen at a percentile of all pairs so the rows are comparable across normalizations. "Tags per document" is how many concepts would clear it, before any `target` cap.

| cutoff | pairs above | tags per document (median / 10th–90th) | documents with none | hand tags kept |
|---|---|---|---|---|
| 6.428 | 50% | 28 (14–41) | 1 | 169/207 |
| 6.556 | 40% | 21 (8–34) | 1 | 160/207 |
| 6.695 | 30% | 16 (4–30) | 1 | 145/207 |
| 6.775 | 25% | 13 (3–26) | 1 | 133/207 |
| 6.870 | 20% | 10 (2–20) | 2 | 119/207 |
| 6.980 | 15% | 7 (1–16) | 3 | 110/207 |
| 7.137 | 10% | 4 (1–12) | 6 | 95/207 |
| 7.359 | 5% | 2 (0–6) | 10 | 73/207 |

At the 10% cutoff, these clear nothing: proust-and-the-squid (Book Note), why-shortcuts-arent-the-road (Web Clipping), design-for-the-human-scale (Keynote), ia-the-current-and-the-future (Panel), improv-consulting-yes-and-experts-improvise-solutions-to-real-problems (Panel), language-arts-for-the-lizard-brain (Talk).

### Thresholds under "anchored"

Each row is a cutoff, chosen at a percentile of all pairs so the rows are comparable across normalizations. "Tags per document" is how many concepts would clear it, before any `target` cap.

| cutoff | pairs above | tags per document (median / 10th–90th) | documents with none | hand tags kept |
|---|---|---|---|---|
| 0.335 | 50% | 28 (14–41) | 1 | 168/207 |
| 0.362 | 40% | 21 (9–35) | 1 | 158/207 |
| 0.393 | 30% | 15 (4–28) | 1 | 145/207 |
| 0.411 | 25% | 13 (3–25) | 1 | 133/207 |
| 0.430 | 20% | 10 (1–19) | 2 | 116/207 |
| 0.456 | 15% | 7 (1–16) | 4 | 106/207 |
| 0.487 | 10% | 4 (1–13) | 6 | 93/207 |
| 0.542 | 5% | 2 (0–6) | 11 | 71/207 |

At the 10% cutoff, these clear nothing: proust-and-the-squid (Book Note), why-shortcuts-arent-the-road (Web Clipping), design-for-the-human-scale (Keynote), ia-the-current-and-the-future (Panel), improv-consulting-yes-and-experts-improvise-solutions-to-real-problems (Panel), language-arts-for-the-lizard-brain (Talk).

### Thresholds under "self-anchored"

Each row is a cutoff, chosen at a percentile of all pairs so the rows are comparable across normalizations. "Tags per document" is how many concepts would clear it, before any `target` cap.

| cutoff | pairs above | tags per document (median / 10th–90th) | documents with none | hand tags kept |
|---|---|---|---|---|
| 0.213 | 50% | 26 (12–45) | 1 | 169/207 |
| 0.243 | 40% | 21 (8–36) | 1 | 158/207 |
| 0.279 | 30% | 15 (4–29) | 1 | 144/207 |
| 0.300 | 25% | 13 (3–24) | 1 | 134/207 |
| 0.320 | 20% | 10 (2–20) | 1 | 123/207 |
| 0.347 | 15% | 6 (1–16) | 3 | 114/207 |
| 0.384 | 10% | 4 (1–13) | 6 | 95/207 |
| 0.449 | 5% | 2 (0–6) | 11 | 74/207 |

At the 10% cutoff, these clear nothing: cognitive-science-for-designers (Perspective), proust-and-the-squid (Book Note), why-shortcuts-arent-the-road (Web Clipping), design-for-the-human-scale (Keynote), ia-the-current-and-the-future (Panel), language-arts-for-the-lizard-brain (Talk).

## Hubs

A hub is a concept whose wording scores high against most documents, so it shows up in many documents' top 4 whether or not they are about it. Normalizing within each concept (z-score, percentile) is the textbook cure, and it scored worse on recall@k here.

| concept | in top 4 of | hand-tagged on | broader concept? |
|---|---|---|---|
| Information Architecture | 23 | 6 | yes |
| Structured Content | 20 | 19 |  |
| AI Integration | 17 | 12 |  |
| Taxonomy | 17 | 18 |  |
| Navigation Design | 15 | 3 |  |
| Content Modeling | 13 | 18 |  |
| Discoverability | 12 | 2 |  |
| Sanity | 11 | 4 |  |

9 of 55 concepts are in no document's top 4.

## The specificity rule

Under "raw", **26 of 73** documents have a concept and its own broader concept together in their top 4. Each of those is a slot the rule frees.

## Examples under "raw"

Top six concepts per document. ✓ marks a hand tag; hand tags outside the top six are listed after.

**Purpose-Driven Taxonomy Design** (Method), 2 hand tag(s)

✓ Taxonomy 8.121 · Tree Testing 7.823 · Discoverability 7.542 · Card Sorting 7.526 · Search 7.523 · Governance 7.502

Hand tags further down: Usability Testing (#18)

**WHO Knowledge Action Portal** (Case Study), 2 hand tag(s)

✓ Accessibility Evaluation 7.879 · ✓ Performance Evaluation 7.644 · Heuristic Analysis 7.411 · Usability Testing 7.031 · User Flows 7.028 · Discoverability 6.914

**Proust and the Squid** (Book Note), 1 hand tag(s)

Discoverability 6.179 · Responsive Design 6.165 · Systems Thinking 6.109 · Content Discovery 6.094 · Digital Communication 6.082 · Tree Testing 5.993

Hand tags further down: Mental Models (#14)

**IA, the Current and the Future** (Panel), 1 hand tag(s)

✓ Information Architecture 7.017 · Interaction Design 6.798 · Interoperability 6.678 · AI Integration 6.674 · Systems Thinking 6.547 · Governance 6.530

**Knowledge Graphs and IA** (Interview), 0 hand tag(s)

Knowledge Graphs 8.142 · Information Architecture 7.268 · Linked Data 6.934 · Discoverability 6.887 · Taxonomy 6.838 · Search 6.809

