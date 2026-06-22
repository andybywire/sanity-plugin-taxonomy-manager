# sanity-plugin-taxonomy-manager

Orientation for working in this repo (human or AI-assisted). User-facing install/usage lives in the
[README](README.md) and the docs site ([sanitytaxonomymanager.com](https://sanitytaxonomymanager.com),
built from [`docs/`](docs/)); the design rationale lives in [`docs/development/`](docs/development/).
This file is the "how we work here" summary.

## What this plugin is

A Sanity Studio plugin for building and maintaining [SKOS](https://www.w3.org/TR/skos-reference/)-compliant
taxonomies. It contributes two document types — `skosConcept` and `skosConceptScheme` — and a **Taxonomy**
structure tool whose **Tree View** renders a scheme's concept hierarchy. Two field input components,
`ReferenceHierarchyInput` and `ArrayHierarchyInput`, replace the default reference inputs with a hierarchy
browser, with optional **semantic term recommendations** backed by dataset embeddings. The public API is
exactly **six exports**, pinned by [`src/index.test.ts`](src/index.test.ts).

## Architecture (preserve this shape)

Concentric layers: all logic in a pure core, Sanity coupling isolated in thin seams, components as a thin
shell. Full rationale in [ADR 0001](docs/development/decisions/0001-pure-core-data-port.md).

- **Pure core — `src/core/*`** (no React, Sanity Studio, or network; unit-tested directly): GROQ builders
  (`queries.ts`), id math (`ids.ts`, `createId.ts`), mutation planning (`mutations.ts`), filters and
  validation, tree transforms (`tree/`), and `semanticRecommendations.ts`. **Logic lives here — extend
  the core, don't thread it into components.**
- **The data-port seam — [`src/core/ports.ts`](src/core/ports.ts)** (`TaxonomyDataPort`): the single
  interface for everything that touches Studio or the network — the live concept-tree query, concept
  mutations, and semantic recommendations. Implemented by `seams/StudioDataAdapter`, reached via
  `seams/TaxonomyPortContext`. The adapter is the **default**, so production needs no provider; tests
  inject `test/FakeDataPort`.
- **Thin shell — `src/components/*`, `src/hooks/*`, `src/views/*`**: render the core's output and route
  interactions through the port. Don't reach for Studio clients/form values beyond the established seams.
- **Assembly:** `src/index.ts` (the six public exports), `src/structure.tsx` (the `'taxonomy'` tool +
  `createDefaultDocumentNode`).

Deliberately **not** behind the port (see ADR 0001): the reference-field filters (`helpers/`), the
array-input resource patch, and `views/ConceptUseView` (calls `useListeningQuery` directly).

## Development

- **`pnpm dev`** — runs the bundled dev Studio (`studio/`, Sanity 6, project `zw90ihi2` / `dev`); the
  plugin is served live from `src/` via `vite-tsconfig-paths` (HMR). Visual / behind-auth checks are the
  author's eyeball.
- **The gate before every commit:** `pnpm test && pnpm typecheck && pnpm build && pnpm lint` — all green.
- **TDD is the default cadence.** The pure core makes most tests plain input→output with hand-built
  fixtures (no mocks). Component behavior is tested by injecting `test/FakeDataPort` (no Studio boot); the
  input components use a jsdom harness ([`test/inputHarness`](src/test/inputHarness.tsx)) that stubs the
  Studio hooks (`useClient` / `useFormValue` / `usePerspective`) + `FormField` and drives the seam through
  the fake. DOM tests cover interaction wiring (gating, config warnings, browse-only, the duplicate-term
  toast) — not visual correctness, which stays the author's eyeball check.
- **The studio is outside the gate** (eslint-ignored; not in typecheck/build/test). `pnpm --filter studio
  build` is the headless integration check.
- Two non-obvious traps: the recommendations GROQ parameter is `$searchQuery`, **not** `$query` (`query`
  is a reserved `@sanity/client` `QueryParams` key — a `$query` param fails typecheck cryptically); and
  reference-field `filter` functions must be **arity-1** (the inputs treat a zero-arity filter as
  misconfigured). See [ADR 0002](docs/development/decisions/0002-semantic-recommendations.md).

## Commits & releases (read before committing)

- **Conventional Commits**, enforced by **commitlint** (a `commit-msg` hook husky installs on
  `pnpm install`); `pre-commit` runs lint-staged (eslint + `tsc --noEmit`). **Body lines ≤100 chars.**
- **The commit type drives the release:** `fix:` → patch, `feat:` → minor, `feat!:` / `BREAKING CHANGE:`
  → major; `chore` / `docs` / `test` / `ci` / `refactor` → **no release**. Name commits accordingly.
- **Use `git commit -F <file>`, not `-m`,** for messages containing backticks (zsh eats backtick spans).
- **Releases are automated — never `npm publish` by hand.** Merging to `main` triggers **semantic-release**
  over OIDC trusted publishing: version bump, `CHANGELOG.md`, npm publish (with provenance), GitHub
  release. `CHANGELOG.md` is **generated — never hand-edit it.** Use **merge commits, never squash/rebase
  `main`** — semantic-release reads every commit to build the changelog and pick the version, and
  rebasing orphans the version tag. Setup + rationale: [ADR 0003](docs/development/decisions/0003-5.0.0-platform-modernization.md).

## Working on issues

GitHub Issues are the work queue (e.g.
[#93](https://github.com/andybywire/sanity-plugin-taxonomy-manager/issues/93)). Loop: issue → branch
(`<type>/<issue#>-<slug>`) → implement (TDD) → PR with **`Closes #N`** in the body → merge commit.

## Layout

- **`src/core/`** — the pure, tested core (queries, ids, mutations, filters, validation, `tree/`,
  `semanticRecommendations`, and `ports.ts` — the data-port interface).
- **`src/seams/`** — `StudioDataAdapter` (default port impl) + `TaxonomyPortContext`.
- **`src/components/`, `src/hooks/`, `src/views/`** — the thin component shell.
- **`src/test/`** — `FakeDataPort`, `inputHarness`, `renderWithUi` (test infrastructure).
- **`studio/`** — bundled dev Studio (a pnpm workspace member).
- **`docs/`** — user documentation site (Docsify). **[`docs/development/`](docs/development/)** —
  architecture + decision records (ADRs) for contributors and agents.
