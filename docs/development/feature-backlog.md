# Feature backlog

What is planned after 6.2.0, in order, with the reasoning behind the order and the decisions
already taken. Planned with the author on 2026-11-09/10. This is a living document — when a
feature ships, move its decisions into an ADR and delete the entry.

Kept here rather than in `docs/` proper because it is contributor-facing: the Docsify site
navigation (`_navbar.md`) deliberately excludes this directory.

## The order

| # | Feature | Why here |
|---|---|---|
| 1 | **Governance / "Stats" view** | The only item answering a question an editor cannot answer at all today. Everything else has a workaround. |
| 2 | **CSV import** | An *adoption* feature where RDF export is an *exit* one, and it has demand evidence — a [recipe](https://www.sanity.io/recipes/import-taxonomy-terms-b46af03f) already exists, and tutorials follow questions. #125 also made it much cheaper: a bulk import is now N `document.create`s plus scheme appends on the existing `conceptPlanEdits` path. |
| 3 | **Multi-tag + in-tree display of applied tags** | Cadence filler between larger pieces. Lighter than it looks — both input components already receive the field `value`, so the in-tree display is mostly presentational. **Ship the two together**: multi-tag without showing current state is worse than either alone. |
| 4 | **RDF export, as JSON-LD only** | Reframed and shrunk. GROQ returns JSON, so it cannot emit Turtle or N3 — those need a serializer dependency (against #99) or a Sanity Function. JSON-LD is a projection plus a documented `@context`, costs almost nothing, and covers the integration case. Add Turtle only if asked. |
| 5 | **Merge** | Only if the governance view shows it is needed. It repoints every reference, re-parents children and retires a term — N documents the plugin does not hold. |

**Dropped: the semantic-recommendations rework.** It was believed to still use a deprecated
embeddings API. It does not — [ADR 0002](decisions/0002-semantic-recommendations.md) *is* that
migration, and the code runs `score(text::semanticSimilarity($searchQuery))`, which is Sanity's
current replacement. All that remains is confirming the dev dataset has embeddings enabled. Note
these queries count against the organization's monthly semantic-search quota.

## 1 · Governance view — decided

Settled during design exploration; build to this unless something is learned in use.

- **Hierarchy-first.** The tree is how people understand their schemes, so the Stats view keeps
  it: same indentation, same row anatomy, `Collapse | Expand` matching the Tree View header. One
  count column, one bar lane.
- **Counts follow the Studio perspective** (Published / Drafts / the selected release), like
  every other query in the plugin. This is both consistent — #128 exists precisely because the
  insert picker did not follow the perspective — and simpler: a perspective already collapses
  each document to one normalised id, so no `array::unique` and no id normalisation.
- **Read-only in v1.** No merge, no retire. The dashboard is what tells you whether those are
  worth building.
- **No sorting in v1.** It carries real complexity — flattening loses the path, and the highlight
  has to survive the reorder — for a payoff that is unclear before anyone uses the view. If it
  returns, prefer **sorting within each branch**, which ranks siblings without flattening.
- **No branch rollup in v1.** Deferred to a per-row overflow (`⋯`) option, "show child counts".
  Two unresolved problems made it not worth the first iteration: it is **hard to message
  concisely**, and the number itself is ambiguous (below).
- **Clicking a concept** opens it in the pane to the right and highlights it in the list. This
  needs no new router work: `core/activeConcept.ts` already derives the active concept from
  `routerPanesState`, and the Stats view would be a sibling `S.view.component()` on the same
  document node, so it shares the pane group. Switching tabs preserves the highlight by
  construction.
- **`views/ConceptUseView` stays.** See below.

### The branch-total question, for when it returns

If a document is tagged with both `History` and `Classical History`, is the History branch total
**2** (a sum of per-term counts) or **1** (distinct documents the branch touches)? Distinct is
almost certainly what a steward means, and it changes the implementation: a sum is a pure tree
fold over per-term counts, while distinct needs either a GROQ count per subtree
(`references($subtreeIds)`) or per-term document ids unioned in the core. Decide before building,
not after.

A related gap the two-tone bar did *not* close: a wholly dead branch of eleven terms and a single
dead leaf both render `0`. That is the largest cleanup opportunity in a taxonomy rendering as the
smallest. A muted term count on wholly-unused branches would restore it.

## Incoming references — spiked, decided

Sanity shipped incoming references in Studio v5.8.0, within the plugin's `^6.9.2` peer floor.
**Neither native option can replace `ConceptUseView`:**

- `defineIncomingReferenceDecoration` is **`@beta`**, and it is a *form decoration* — it renders
  inline among the document's fields, not in a pane. Long lists of tagged content are exactly
  what should not be inline.
- The native inspector (document `⋯` menu) *is* a pane, but `sanity/structure` exports only
  `IncomingReferencesOptions` and `IncomingReferenceAction` — types, no component and no
  inspector handle. Opening it programmatically would mean internals, which
  [ADR 0005](decisions/0005-hierarchy-editing.md) warns against.

`ConceptUseView` is already the right shape: a sibling view on the document pane. What it needs
is its perspective brought in line with the governance rollup so the two agree. Revisit if the
decoration leaves beta *and* a pane-level variant appears.

## Later — a "Health" panel

The distribution view explored during design (hero figure, usage curve, the long tail of unused
terms as a flat segment) belongs in a broader health panel rather than in the governance view.
The spec for what else belongs is the **qSKOS quality issue catalogue** —
<https://github.com/cmader/qSKOS/wiki/Quality-Issues> — orphan and loose concepts, `skos:broader`
cycles, disconnected clusters, missing or overlapping labels, omitted top concepts. Several the
plugin can already compute from the tree it holds. That is a stronger backbone than usage alone,
and it is something Contentful's native taxonomy does not offer.

## Also open

- **User documentation** for everything 6.2.0 shipped. Deliberately deferred so it is written
  from hands-on use rather than from the implementation; a structural sketch exists.
- **[#93](https://github.com/andybywire/sanity-plugin-taxonomy-manager/issues/93)** — scope
  semantic recommendations to the branch.
- **[#106](https://github.com/andybywire/sanity-plugin-taxonomy-manager/issues/106)** — the
  published `exports` advertise a `source` condition. Not fixable with a `package.json` edit; see
  the issue for why `publishConfig.exports` is inert under `npm publish`.
- **[#130](https://github.com/andybywire/sanity-plugin-taxonomy-manager/issues/130)** —
  auto-expand a collapsed branch when a drag hovers it.
