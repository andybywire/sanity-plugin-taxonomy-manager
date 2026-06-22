# ADR 0002 — Semantic recommendations via `text::semanticSimilarity`

**Status:** accepted

**Builds on:** [0001](0001-pure-core-data-port.md) — recommendations are one of the three data-port seams.

## Context

The input components can annotate the hierarchy tree with "this term matches your content" hints. In
v4.7.2 that used the **deprecated Embeddings Index API**: a REST call to
`/embeddings-index/query/<dataset>/<index>` (the `text::embedding()` family), configured with a named
index. The supported replacement is dataset embeddings queried in GROQ with `text::semanticSimilarity()`.
The migration was bundled into 5.0.0 as a sanctioned breaking change.

## Decision

Replace the REST call with a GROQ query, and put the decision-bearing logic in a pure core module
([`src/core/semanticRecommendations.ts`](../../../src/core/semanticRecommendations.ts)) run through a
thinned `useSemanticRecommendations` hook on a published-perspective client.

The query scores `skosConcept`s by similarity to the assembled field text and returns the top matches:

```groq
*[_type == "skosConcept" && _id in *[_type == "skosConceptScheme" && schemeId == $schemeId][0]{
  "ids": coalesce(topConcepts[]._ref, []) + coalesce(concepts[]._ref, [])
}.ids] | score(text::semanticSimilarity($searchQuery)) | order(_score desc) [0...$maxResults] {
  "conceptId": _id, "score": _score
}
```

### Public API (clean break in 5.0.0)

- The input prop `embeddingsIndex` → **`semanticSearch`**, dropping the now-obsolete `indexName`
  (embeddings are **dataset-level**, not index-scoped). Config is `{fieldReferences, maxResults?}`.
- The result type `EmbeddingsResult` (`{score, value:{documentId, type}}`) → **`ConceptRecommendation`**
  (`{conceptId, score}`) — the GROQ projection owns the shape, so the dead nested wrapper is gone.

### Display: the score is opaque — show a badge, not a percentage

`text::semanticSimilarity()`'s `_score` is **unbounded and opaque** (the docs: "not a measure of general
match quality"). The old code multiplied a 0–1 cosine similarity by 100 to get a percentage; doing that to
the new score rendered nonsense like **"658.5%"**. Decision: drop the number entirely. Recommended
concepts get a single green **"recommended" badge** (`@sanity/ui` `tone="positive"`). Internally the tree
node carries a boolean `recommended`, not a score: `recommendedConceptIds(recs)` →
`annotateRecommendations(node, ids)`. (A numbered-rank display was prototyped and rejected — the rank
isn't meaningful enough to surface.)

### Scope: recommendations are scheme-scoped

The query scores only concepts **in the field's scheme** — membership via the scheme's
`topConcepts`/`concepts` refs, matched by `$schemeId`. An earlier dataset-wide version returned the global
top-N, which often landed entirely outside the field's scheme and so showed no badges at all.
`triggerSearch(schemeId)` threads the resolved filter's scheme. **Branch-level scoping** (for
`branchFilter` fields, which show only a branch) is the known follow-up —
[#93](https://github.com/andybywire/sanity-plugin-taxonomy-manager/issues/93).

### Graceful degradation

A dataset without embeddings errors on the query; the hook classifies it and surfaces a friendly "not
enabled" notice while the tree still renders normally (only the badges are absent).

## Gotchas (durable — these cost real time)

- **The GROQ parameter is `$searchQuery`, not `$query`.** `query` is a *reserved key* in
  `@sanity/client`'s `QueryParams` type (declared `never` to catch fetch-options-passed-as-params), so a
  `$query` parameter fails `tsc` with a cryptic "Type 'string' is not assignable to type 'undefined'."
- **`apiVersion` is `'vX'`.** `text::semanticSimilarity()` is documented as stable, but its minimum *dated*
  API version isn't published, and some tooling's pinned GROQ version rejects the function outright. `'vX'`
  is what the old embeddings hook already used (no stability regression). Pin to a dated version once
  confirmed against the live API.
- **Test filters must be arity-1.** The input components treat a `filter` whose `.length === 0` as
  misconfigured, so harness/test filters must declare an argument — a bare `vi.fn()` (arity 0) trips the
  config-warning path. (See [0001](0001-pure-core-data-port.md) on the input-component harness.)

## Consequences

- Off the deprecated API; the display path (`annotateRecommendations` → badge) is pure and unit-tested,
  and the live query is exercised through the data port (the fake supplies canned recommendations).
- 5.0.0 public breaks: the `semanticSearch` prop and the `ConceptRecommendation` type.
- Branch-level scoping remains open (#93); revisit if a `branchFilter` field ever needs recommendations.
