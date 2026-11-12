# ADR 0006 — The governance ("Stats") view

**Status:** accepted. Extends [ADR 0001](0001-pure-core-data-port.md), whose pure-core/data-port
shape this work follows, and adds the one piece of state that shape did not have.

## Context

A steward could ask "what is tagged with this term?" one term at a time, through
`views/ConceptUseView`. They could not ask "which terms in this scheme are used, and which are
not" at all. That was the only item on the post-6.2.0 backlog answering a question with no
workaround, which is why it went first.

The design was settled before implementation ("Governance B.3"): hierarchy-first, because the
tree is how people understand their schemes — same indentation, same row anatomy, the same
`Collapse | Expand` header, one count column and one bar lane.

## Decision

### A sibling view, which is what makes the highlight free

The Stats view is a second `S.view.component()` on the same `skosConceptScheme` document node as
the Tree View. Sibling views share a pane group, so a concept opened from either lands in the
same pane, `core/activeConcept` reads it the same way from both, and switching tabs preserves the
highlight by construction. No router work was needed, and none was done.

### Read-only, with no sorting and no branch rollup

v1 answers the question and offers no action on the answer. Sorting carries real complexity —
flattening loses the path, and the highlight has to survive the reorder — for a payoff that is
unclear before anyone has used the view. A branch rollup is deferred for a sharper reason: the
number is ambiguous. If a document is tagged with both `History` and `Classical History`, the
`History` branch total is either 2 (a sum of per-term counts) or 1 (distinct documents the branch
touches). Distinct is almost certainly what a steward means, and it is the harder of the two —
a sum is a pure tree fold, distinct needs a GROQ count per subtree or per-term document ids
unioned in the core. **Decide that before building it, not after.**

### Counts follow the Studio perspective

Like every other query in the plugin, and for the reason ADR 0005 drew from the insert picker:
a query takes its perspective from the same place the tree does rather than choosing one. A count
sitting beside a tree row has to be counting the world that row came from. A perspective also
collapses each document to one normalized id, so there is no `array::unique` and no id
reconciliation — the complications a `raw` version of this query needed.

What this loses: "used only in a release I am not currently viewing" is invisible. That matters
when *retiring* a term, not when reading one, so it is deferred to the destructive moment if
merge or retire is ever built.

The mapping itself is now one function, `core/perspective.ts`. It is trivial and deliberately
named: writing it once means a call site can get the perspective wrong only by passing the wrong
perspective, never by spelling the mapping differently.

### One content predicate, shared with `ConceptUseView`

`TAGGED_RESOURCE_FILTER` in `core/queries.ts` is the whole of what counts as a tagged resource,
and both the scheme-wide rollup and the per-concept list use it. The two answer one question at
two scales; a steward who opens a term showing 12 and counts 11 rows has no reason to trust
either number again. Sharing the predicate makes that impossible rather than merely unlikely, and
there is a test asserting both queries carry it and that neither grows one of its own.

`ConceptUseView` stays outside the data port, as ADR 0001 has it. Only the GROQ is shared.

## Two things the spike got wrong, both found by measuring

The usage-query spike recorded its results as settled. Two of them were not, and both had been
derived rather than observed.

**`path("system.**")` excludes nothing.** System documents carry ids under `_.**` —
`_.groups.administrator`, `_.releases.<name>`, `_.schemas.<id>` — under `raw` and under a
perspective alike. Measured against the dev dataset: `path("system.**")` matched **0 of 14**,
`path("_.**")` matched all of them. Nothing was miscounted only because no system document
happened to reference a concept. The shared predicate uses the prefix the documents actually
carry.

**`^` inside a top-level filter returns wrong counts.** A query shaped
`*[_type == "skosConcept" && count(*[… && references(^._id)]) > 0]{…}` has no enclosing scope for
`^` to bind to, and returns plausible, wrong numbers. Scope by `_id in $ids` and use `^._id` only
in the **projection**. This is where the spike's "13 concepts referenced, max 3 uses each" came
from; the dev dataset actually holds **11 content documents** (the earlier 25 counted the 14
system documents the broken filter failed to exclude) and **4** concepts referenced by content,
max **2** uses. The builder was verified against a hand-built tally of the raw documents.

**The lesson is ADR 0005's, again:** claims about Content Lake behavior get observed before they
are relied on. Both of these looked right and were cheap to check.

## Scaling, settled by reading the query plan

The open worry was `references()` fan-out over a production corpus, and the proposed answer was
to seed a density dataset. The HTTP API's `explain=true` answered most of it for nothing. The
output is readable once you know the two shapes: `Aggregate`/`Fetch` with the predicate inside
`Filter:` means pushed down to the index; `Pipeline { Fetch → FilterStep }` means over-fetch and
filter in memory. Confirmed by running a deliberately unoptimizable filter alongside, which drops
to the pipeline form.

- **Corpus size is a non-issue.** The whole predicate pushes into `Filter:`, and
  `references(^._id)` is on Sanity's documented list of optimizable expressions — it is their
  literal example. Dataset growth does not affect an optimized filtered query.
- **Term count is cheap.** The planner does *not* run one subquery per term. It unions every id
  in `$ids` and runs a single indexed fetch, bucketed per term — `HashBatchStep` over
  `unionFlat`. A 500-term scheme is not 500 lookups.
- **Reference density into one scheme is still open.** That batched fetch carries no `Selection:`,
  so it appears to materialize matching documents, and projecting `._id` on the inner count does
  not change the plan.

`_type in [...]` was measured to push down too, but it is not on the documented list and a
`count()` is optimizable only if its interior is *completely* optimizable — hence the two `!=`
comparisons.

**No density dataset was built.** The author's decision: evaluate in practice, and build one only
if the view feels slow. The port seam is the insurance — `useWatchConceptUsage` has the same
signature whether the adapter runs a live listener, a one-shot fetch or a debounced refetch, so
that question can be answered later without touching a component.

## Counts are global, and the label has to say so

A count is "documents referencing this concept", full stop. The Stats view's **list of terms** is
scheme-scoped; each **count** on it is not. `ConceptUseView` shows the same number and says
"(all schemes)" out loud.

This was checked rather than assumed, on a concept that is a member of two schemes: `Sociology`
belongs to both `Subjects` and `Educational Resources`, and both views report **2**. They cannot
disagree, because both count references to the same document.

**Scheme attribution is not available and was deliberately not built.** A tag is a reference to a
concept; it records nothing about the scheme the concept belonged to when it was applied. It
could in principle be derived — `schemeFilter(schemeId)` could carry its scheme on the returned
function, the plugin could walk `useSchema()` to map field paths to schemes, and the query could
count only references in fields bound to this scheme. The objection is not cost: **it would only
work for consumers who used `schemeFilter`**. Anyone with a plain filter, or none, would get
nothing, so some counts would be scheme-scoped and others global with nothing on screen telling
them apart. Consistently global beats silently partial.

The better classification, if this returns, is by **field** rather than by scheme — a document
could conceivably tag the same concept in two fields, and the field is what carries the editorial
intent. Left until the view has been used enough to show where the need actually is.

## The data port gains memory

The two structure views are separate `S.view.component()`s, so Studio unmounts one and mounts the
other when an editor switches tabs. Every switch tore the subscription down and started over: the
pane dropped to a spinner, lost its scrollbar, and the content jumped sideways by the scrollbar's
width when the tree landed and it came back.

`StudioDataAdapter` now keeps the last tree per `(mode, scheme, perspective)` and hands it to a
remount as `initialValue`, capped at 20 entries. Two halves were needed and each was verified
load-bearing by reverting it:

1. the cache itself, and
2. the render condition, which became `loading && !treeData`. `useListeningQuery` sets `loading`
   to `true` on every mount regardless of `initialValue`, so without this the spinner still
   covered the tree the cache had already supplied.

The perspective is in the key, and a test asserts a release never receives the drafts tree —
the one way this could have been genuinely wrong rather than merely ugly, and the failure class
ADR 0005 was written about. The cost is a display window of up to one round trip of staleness on
mount; the mutation path does not read through it, and the alternative on display during that
window was a spinner.

## Two row components, one scaffolding rule

`StatsRow` is a separate component from `ConceptRow` rather than a mode on it. That row carries
drag-and-drop, a row menu, three dialogs and the optimistic-edit context, none of which a
read-only view wants.

The cost of separating them showed up immediately: the two rows disagreed about which leading
slots to hold open, and every label jumped sideways when an editor switched tabs. Each view had
tests against a *description* of the rule, and both passed while the views disagreed.

So the rule moved to `core/rowScaffolding.ts` and both rows read it, and the test that matters
renders **both views from one tree and compares every row's leading slot count**
(`components/stats/alignment.test.tsx`). Where two components must agree, assert the agreement
directly; testing each against a description of the rule is how they drifted in the first place.
Note that the fixture needs a root orphan, or the grip slot never appears and the comparison
passes vacuously.

## Accessibility

- **The current row's cue is not carried by colour.** The row uses Studio's own current-item
  treatment, a solid fill from `color.selectable`. It differs from an unselected row by
  **4.29:1** in light and **6.76:1** in dark — a luminance step that survives greyscale, with the
  label inverting dark-to-white on top of it. The grey `selected` tint it replaced measured
  **1.16:1**, a hue difference and essentially nothing else.
- **Focus moves when the pane opens, and Studio does it.** `PaneRouterContextValue` exposes no
  focus API; the only way to focus the opened pane would be to DOM-query Studio's pane container.
  Checked in a running Studio instead: Studio already moves focus there. Nothing added.
- **The row is not a `<button>` wrapping its own buttons.** The label is the button; the count and
  bar are siblings. Pinned by a test, because the deferred per-row overflow menu would otherwise
  have to break it open again.

## `@sanity/ui`, and four more ways to get a colour wrong

This is the ADR 0005 trap in its colour form: the values are all in the theme, and none of them
are where you would guess.

- **`color.selectable` is the palette Studio styles its current pane items from, and no
  `@sanity/ui` component consumes it.** It appears in the type files and never in the runtime JS,
  so Studio styles those items itself and so must we — reproduce from the theme, do not import.
  `Button mode="bleed" tone="primary" selected` gives a *pale* fill, not this one.
- **`Badge` wraps its children in a `Text` that declares `color: var(--card-fg-color)`.** A
  `color` set on the Badge is overridden before it reaches the glyph. Set the **variable**. The
  same trap `ConceptStatusMarkers` already documented for `Text`, walked into again — and a test
  that asserted the declaration on the Badge root passed while the chip rendered muted.
- **Never set an inline `boxShadow` on a `@sanity/ui` control.** That is how it draws the focus
  ring, and an inline one silently removes it.
- **The space scale is Fibonacci-ish**, `[0, 4, 8, 12, 20, 32, 52, 84, …]`, so `padding={4}` is
  20px and `paddingTop={5}` is 32px. Guessing an index gets this wrong.

On the chip that sits on a current row, three things were learned by measuring and are worth not
re-deriving: chroma makes a chip shout while luminance makes it legible, and the two can be moved
separately; darker-plus-desaturated reads as mud where lighter-plus-desaturated reads as pastel,
so the light and dark grounds cannot share a recipe; and prominence has no formula — the light
value was found by walking lightness a notch at a time until it broke.

## Consequences

- **`views/ConceptUseView` changed behavior.** It now excludes system documents, which it never
  did, and uses the documented-optimizable `!=` form. Its perspective handling already matched
  the rollup's; what differed was the predicate.
- **The Tree View changed too**, in four ways, all shared rather than duplicated: the description
  block is one component at 32px, the grip rule is one function, a row at the depth cap reserves
  the action slot it had been dropping, and the current row is now Studio's fill rather than a
  grey tint.
- **The public API is unchanged.** The Stats view is reached through `createDefaultDocumentNode`;
  the six exports pinned by `src/index.test.ts` are the same six.
- **Density is unresolved by choice.** If the view is slow on a real corpus, the adapter changes
  and the components do not.
- Merge and retire remain unbuilt, and this view is what should decide whether they are worth
  building.
