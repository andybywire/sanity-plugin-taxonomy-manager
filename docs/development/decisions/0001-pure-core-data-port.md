# ADR 0001 — Pure core behind a data-port seam

**Status:** accepted

## Context

In v4.7.2 the plugin's logic was interwoven with its React components, which called Studio and the network
directly — `useListeningQuery` for the live tree, `useClient().transaction()` for mutations, a REST call
for embeddings recommendations. Two problems followed: behavior could only be tested by booting a Studio
(so it largely wasn't), and the data layer was welded to today's Studio APIs, with no room to adopt
newer ones (App SDK, the Live Content API) without rewriting components.

The goal was testability and a swappable data layer **without** a from-scratch rewrite — a
refactor-in-place with targeted rewrites that preserved all existing behavior.

## Decision

Adopt a concentric architecture: a pure core, Sanity coupling isolated behind one seam, components as a
thin shell.

### A pure core — `src/core/*`

All decision-bearing logic moves into modules with **no React, Sanity Studio, or network imports**: GROQ
builders (`queries.ts`), id/release-version math (`ids.ts`, `createId.ts`), mutation planning
(`mutations.ts` — pure plan objects later replayed onto a transaction), reference filters and validation,
tree transforms (`tree/`), and the recommendations query/mapping (`semanticRecommendations.ts`). Each is
unit-tested directly with hand-built fixtures and no mocks. **Logic is extended here, not in components.**

### One data-port seam — `TaxonomyDataPort`

Everything that touches Studio or the network sits behind a single interface,
[`src/core/ports.ts`](../../../src/core/ports.ts). Its three members are the "core three" seams:

- `useWatchTree` — the live concept-tree query
- `useApplyConceptPlan` — replays a pure `core/mutations` plan onto a Studio transaction
- `useSemanticRecommendations` — semantic term recommendations

Members are hooks (`use*`) because the watch wraps a Studio hook and the others read the client from React
context. The default implementation, `seams/StudioDataAdapter`, is today's behavior lifted verbatim
(`useListeningQuery` + client transactions + the recommendations query). It's reached via
`seams/TaxonomyPortContext`, where **the adapter is the default** — production needs no provider — and
tests inject `test/FakeDataPort` (synchronous fixtures + recorded calls).

### Alternatives and scope

- **App SDK (`@sanity/sdk-react`) — deferred.** Its mutations can't yet target Content Releases and
  `useQuery` has no documented perspective option. The port keeps that door open: adopting it later is a
  one-file change to the adapter, not a component rewrite.
- **`useListeningQuery` kept as the watch seam.** Investigated `client.listen()` directly; the docs steer
  raw listeners toward backend use, and the "modern" reactive path is the deferred Live Content API / App
  SDK. `useListeningQuery` wraps Studio's `documentStore.listenQuery`, which is the right Studio-side
  choice today. The port makes it swappable.
- **Deliberately *not* behind the port:** the reference-field filters (`helpers/schemeFilter`,
  `branchFilter` — fetch closures that are public API and already mocked-client tested); the array-input
  resource patch (the "third mutation site" in `ArrayHierarchyInput.handleAction`); and
  `views/ConceptUseView` (calls `useListeningQuery` directly). Porting these added cost without a
  testability gain, so they stay impure by design.

### The testing strategy this enables

- **Pure core → direct input→output tests**, no mocks; contract shapes pinned with strict `toEqual`.
- **Components → inject `FakeDataPort`** (no Studio boot) to exercise rendering, loading, and that
  interactions route to the port.
- **Input components → a jsdom harness** ([`test/inputHarness`](../../../src/test/inputHarness.tsx)) that
  stubs the Studio hooks (`useClient` / `useFormValue` / `usePerspective`) and `FormField`, and drives the
  data seam through the fake. DOM tests cover interaction wiring (gating, config warnings, browse-only,
  the duplicate-term toast), not visual correctness.
- The export surface (the six public exports + the two schema type names) is pinned by
  [`src/index.test.ts`](../../../src/index.test.ts).

## Consequences

- Logic is unit-tested without a Studio, and the data layer is a one-file swap (App SDK / Live Content API
  when they're ready).
- The standing discipline: **logic in `core/`, Sanity coupling in thin seams; don't thread Studio details
  (clients, form values) into components beyond the established seams.**
- The split is intentional, not total: the "core three" seams are ported; the filters and the array patch
  remain impure. A future change that needs them testable would extend the port rather than work around it.
