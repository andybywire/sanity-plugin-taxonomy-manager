> **Archived copy.** From `andybywire/andyfitzgeraldconsulting`,
> `docs/recommendations-research/related-algorithm.md`, at commit `ae73f98` (2026-11-24). Paths and links in it refer to
> that repository, where the whole research folder stays in git history at that commit.

# Related resources: where the algorithm landed

*2026-11-12. The configuration the research settled on: v5's tags under v4's ranking rule.
Stream 2 wired the site to it on branch `related-ranker` (2026-11-23), without tag scores until
stream 3; until that branch merges, the live site runs the older branch rule.*

It runs in two stages. **Tagging** happens once per document, and it is the only place a
semantic search runs. **Ranking** happens for every page at build, from the stored tags alone.
Inside ranking, relatedness comes from the Topic scheme, and the rest is site policy built on
the Genre scheme.

```mermaid
flowchart TB
  subgraph TAG ["1 · Tagging: once per document, in the Studio"]
    direction TB
    t1["Each Topic concept's text:<br/>label, definition, scope note, example"]
    t2["One semantic search per concept, scoring<br/>the document and the concept's own document"]
    t3["An anchored score for each concept<br/>(raw − 4.9) ÷ (self − 4.9)"]
    t4["Select tags<br/>· author tags first, never bumped<br/>· excluded concepts left out<br/>· 3 slots at ≥ 0.45, then 3 more at ≥ 0.54<br/>· never a concept beside its own parent: the more specific wins<br/>· at least one tag"]
    t1 --> t2 --> t3 --> t4
  end

  store[("Stored on the document<br/>topic: the tags<br/>topicScores: their scores")]
  t4 -- "reviewed in the draft, then published" --> store

  subgraph RANK ["2 · Ranking: for each page, at build, with no semantic search"]
    direction TB
    r0["This page's tags, each with its first parent and its score,<br/>and every other document's"]
    subgraph RELATED ["Relatedness, from the Topic scheme"]
      direction TB
      q1["Compare every pair of tags<br/>· shared: the same concept<br/>· nearer: one is the other's parent<br/>· sibling: the same parent, never a top concept"]
      q2["Divide each tier's count by the size<br/>of the two tag sets' union"]
      q3["Rank by shared, then nearer, then sibling<br/>Ties: the same genre, then tag strength, then newest"]
      q1 --> q2 --> q3
    end
    subgraph POLICY ["Site policy, from the Genre scheme"]
      direction TB
      p1["Two categories, each a Genre subtree<br/>Insights: under Document<br/>Presentations: under Presentation"]
      p2["The best 3 from the page's own category"]
      p3{"A piece from the other category with<br/>≥ 2 shared tags, a shared ratio ≥ 0.5,<br/>that beats the third card or fills a gap?"}
      p4["Swap in at most one"]
      p5{"Anything related<br/>at all?"}
      out1(["Related Insights<br/>or Related Insights & Presentations"])
      out2(["Recent: the newest from the page's own category,<br/>its own genre first"])
    end
    r0 --> p1
    p1 -- "every candidate, both categories" --> q1
    q3 --> p2 --> p3
    p3 -- yes --> p4 --> p5
    p3 -- no --> p5
    p5 -- yes --> out1
    p5 -- no --> out2
  end

  store --> r0
```

## Reading it

- **Tag strength** is, for each concept two documents share, the weaker of their two scores,
  summed. Two pieces strongly about what they share outrank two that only brush it.
- **"First parent"** is `broader[0]`. SKOS leaves `skos:broader` unordered, so a concept with
  two parents is related through the first one only. That's a Sanity habit, not a SKOS rule.
- **Nearer and sibling never cross categories.** Crossing is for pieces about the same thing, so
  only shared tags count toward it.
- **A tie on every tier** keeps the pool's order, which is newest first.

| Part | Where it lives |
|---|---|
| Tagging | `studio/tagger/`: `score.ts` (queries), `tagger.ts` (selection), `propose.ts` (author tags and exclusions) |
| Stored tags | `topic` and `topicScores` on articles, case studies, notes and presentations |
| Relatedness and policy | `web/src/lib/related.ts` → `rankAcross`, under `RANK_RULE`: `CROSS_RULE` and `tieBreak: 'genre-strength'` |
| Categories | `web/src/lib/genres.ts` → `subtree`, from the Genre scheme's two top concepts |
