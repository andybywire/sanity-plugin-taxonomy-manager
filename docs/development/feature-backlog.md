# Feature backlog

What is planned after 6.2.0, in order, with the reasoning behind the order and the decisions
already taken. Planned with the author on 2026-11-09/10. This is a living document — when a
feature ships, move its decisions into an ADR and delete the entry.

Kept here rather than in `docs/` proper because it is contributor-facing: the Docsify site
navigation (`_navbar.md`) deliberately excludes this directory.

## The order

| # | Feature | Why here |
|---|---|---|
| 1 | **CSV import** | An *adoption* feature where RDF export is an *exit* one, and it has demand evidence — a [recipe](https://www.sanity.io/recipes/import-taxonomy-terms-b46af03f) already exists, and tutorials follow questions. #125 also made it much cheaper: a bulk import is now N `document.create`s plus scheme appends on the existing `conceptPlanEdits` path. |
| 2 | **Multi-tag + in-tree display of applied tags** | Cadence filler between larger pieces. Lighter than it looks — both input components already receive the field `value`, so the in-tree display is mostly presentational. **Ship the two together**: multi-tag without showing current state is worse than either alone. |
| 3 | **RDF export, as JSON-LD only** | Reframed and shrunk. GROQ returns JSON, so it cannot emit Turtle or N3 — those need a serializer dependency (against #99) or a Sanity Function. JSON-LD is a projection plus a documented `@context`, costs almost nothing, and covers the integration case. Add Turtle only if asked. |
| 4 | **Merge** | Only if the governance view, shipped in [ADR 0006](decisions/0006-governance-view.md), shows it is needed. It repoints every reference, re-parents children and retires a term — N documents the plugin does not hold. |

**Dropped: the semantic-recommendations rework.** It was believed to still use a deprecated
embeddings API. It does not — [ADR 0002](decisions/0002-semantic-recommendations.md) *is* that
migration, and the code runs `score(text::semanticSimilarity($searchQuery))`, which is Sanity's
current replacement. All that remains is confirming the dev dataset has embeddings enabled. Note
these queries count against the organization's monthly semantic-search quota.

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

`ConceptUseView` is already the right shape: a sibling view on the document pane. It now shares
one content predicate with the governance rollup, so the two cannot disagree — see
[ADR 0006](decisions/0006-governance-view.md). Revisit if the decoration leaves beta *and* a
pane-level variant appears.

## Later — a "Health" panel

The distribution view explored during design (hero figure, usage curve, the long tail of unused
terms as a flat segment) belongs in a broader health panel rather than in the governance view.
The spec for what else belongs is the **qSKOS quality issue catalogue** —
<https://github.com/cmader/qSKOS/wiki/Quality-Issues> — orphan and loose concepts, `skos:broader`
cycles, disconnected clusters, missing or overlapping labels, omitted top concepts. Several the
plugin can already compute from the tree it holds. That is a stronger backbone than usage alone,
and it is something Contentful's native taxonomy does not offer.

## Left open by the governance view

Shipped in [ADR 0006](decisions/0006-governance-view.md); these are the parts it deliberately did
not answer.

- **Reference density.** The query plan settles corpus size and term count — neither costs
  anything — but the batched fetch carries no projection, so density into one scheme is unmeasured.
  No density dataset was built: evaluate in use, and only build one if the view feels slow.
- **Branch rollup**, behind a per-row `⋯` → "show child counts". Two problems made it not worth
  the first iteration: it is hard to message concisely, and the number is ambiguous — for a
  document tagged with both `History` and `Classical History`, is the `History` total 2 or 1?
  Distinct is almost certainly what a steward means, and it is the harder of the two. Decide
  before building. A related gap the two-tone bar did *not* close: a wholly dead branch of eleven
  terms and a single dead leaf both render `0`, which is the largest cleanup opportunity in a
  taxonomy rendering as the smallest.
- **Sorting**, if it returns, should sort **within each branch** — ranking siblings without
  flattening, which is what loses the path and breaks the highlight.
- **Attributing a tag to a scheme or a field.** A tag records neither; counts are global. The
  better classification is by field rather than scheme, since a document could tag the same
  concept twice. Left until the view has been used enough to show where the need is.

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
