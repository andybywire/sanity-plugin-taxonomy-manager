# Taxonomy Manager — TDD rebuild plan & progress

A staged, regression-guarded rebuild of this plugin: modern tooling, a tested pure core behind a
swappable data port, a semantic-search migration, and automated continuous release — **preserving
all core functionality**. This doc is the resume point for a fresh session.

> Companion docs: [`docs/baseline-inventory.md`](./baseline-inventory.md) is the v4.7.2 behavior
> **regression contract**. The original full plan also lives at
> `~/.claude/plans/the-current-repository-is-glistening-lark.md`, and ongoing project memory at
> `~/.claude/projects/-Users-andyfitzgerald-Repos-sanity-plugin-taxonomy-manager/memory/`.

## How to resume (read first)

- **Branch state (nothing pushed):** work is on stacked local branches
  `chore/0-baseline-inventory` → `chore/1-tooling-studio` → `chore/2-characterization` →
  `refactor/3-core-extraction` (current HEAD). Start Stage 4 on a new branch off the current HEAD
  (e.g. `feat/4-data-port`). Pushing/PRs are Andy's call.
- **The gate (must be green before every commit):**
  `pnpm test && pnpm typecheck && pnpm build && pnpm lint`. Currently green — **49 tests / 10
  files**, 0 type errors, build clean, lint 0 errors (11 pre-existing "unused eslint-disable"
  warnings, slated for cleanup as files are touched).
- **Dev studio (eyeball):** `pnpm dev` runs the embedded `studio/` (sanity 5, project
  `zw90ihi2` / `dev` dataset). Andy runs visual / behind-auth checks.
- **Working style:** small reviewable chunks, **pause for review at each sub-step**; surface design
  choices before coding; **commit only when Andy asks**; Conventional Commits (**body lines ≤100
  chars**, enforced by commitlint); branch per stage, merge commits (never squash/rebase `main`).

## Locked decisions

1. **Scope:** refactor-in-place with targeted rewrites — NOT a full from-scratch rewrite.
2. **Data layer:** a thin internal `TaxonomyDataPort` defaulting to today's `useListeningQuery` +
   client transactions. App SDK (`@sanity/sdk-react`) is deferred — its mutations can't yet target
   releases, and `useQuery` has no documented perspective option. The port keeps that door open.
3. **Release:** semantic-release + OIDC (replaces release-please) — Stage 7.
4. **Tooling:** pnpm workspace (root plugin + `studio/`).
5. **Sanctioned behavior changes (bundled into a 5.0.0 major, Stage 7 unless noted):** semantic
   recommendations migration off the deprecated Embeddings Index API to
   `text::semanticSimilarity()` (Stage 5); `sanity` peer → `^5 || ^6`; ESM-only `dist/` exports.
   Studio runs **sanity 5** until Stage 7 (plugin still uses `@sanity/ui` v2; a sanity-6 studio
   would load a second `@sanity/ui` v3 and the plugin wouldn't render). Everything else is
   behavior-preserved and guarded by the Stage 2 characterization tests.

## Architecture (target & current)

Concentric layers; logic lives in `src/core/` (pure), Sanity coupling in thin seams.

- **Pure core `src/core/*`** (no react/sanity-studio/network; ~all the logic, unit-tested):
  `queries.ts` (GROQ builders + `MAX_TREE_DEPTH`), `createId.ts`, `filters.ts`
  (`assertSchemeId`/`assertBranchId` + result builders), `validation.ts` (`conceptFilter` +
  `prefLabelUniquenessResult`), `tree/annotateScores.ts`, `ids.ts` (release/version id math +
  `conceptReferenceStrength`), `mutations.ts` (`planCreateConcept`/`planRemoveConcept`). **All have
  co-located `*.test.ts`.**
- **Impure seams** (Stage 4 target): one `TaxonomyDataPort` interface + a `StudioDataAdapter`.
  Today the impurity still lives in: `helpers/schemeFilter.ts`/`branchFilter.ts` (fetch closures,
  public API), `hooks/useCreateConcept`/`useRemoveConcept` (thin executors replaying core plans),
  `hooks/useEmbeddingsRecs` (deprecated embeddings index), `components/Hierarchy.tsx` /
  `inputs/InputHierarchy.tsx` (`useListeningQuery`), `inputs/ArrayHierarchyInput.tsx`
  (resource-doc patch + inline ref-flagging).
- **Thin component shell:** tree views + input components (jsdom interaction tests come in Stage 6).
- **Assembly:** `src/index.ts` (6 public exports — unchanged), `src/structure.ts`.

## Staged roadmap & progress

- **Stage 0 ✅ Baseline capture** — `docs/baseline-inventory.md` (regression contract). `7be65a1`
- **Stage 1 ✅ Tooling + embedded studio** — pnpm workspace, 3-way tsconfig, eslint flat config,
  prettier 3, husky + commitlint, vitest harness (`src/test-setup.ts`, `src/test/renderWithUi.tsx`),
  `studio/` (sanity 5, HMR from `src/` via `vite-tsconfig-paths`). Commits `7f33dc9` (build),
  `d85552b` (lint/hooks), `4e4495d` (vitest), `2b9f17b` (FormField sanity-5 fix), `3c0a50d` (studio).
- **Stage 2 ✅ Characterization tests** — exact-output snapshots for the GROQ builders, shape tests
  for `createId`, mocked-client tests for the filters. `9b9404f`
- **Stage 3 ✅ Extract pure core** — `b2dc6f8` (queries), `70a628f` (createId/filters/validation
  batch), `a90f1be` (annotateScores), `10ceff3` (ids), `847027a` (mutations + thinned hooks).
- **Stage 4 ⬜ NEXT — Data port.** See detail below.
- **Stage 5 ⬜ Semantic recommendations migration** — replace the deprecated Embeddings Index API
  (`client.request('/embeddings-index/…')`, `text::embedding()`) with a GROQ
  `score(text::semanticSimilarity($q))` query in a new `core/semanticRecommendations.ts`; redesign
  the public `embeddingsIndex` option (clean break in 5.0.0); graceful degradation when a dataset
  has no embeddings enabled. The display path (`annotateScores` → `_score`) is unchanged.
- **Stage 6 ⬜ Component interaction tests + assembly hardening** — jsdom tests for tree views +
  input components (gating, warnings, browse-only, duplicate toast); export-surface test pinning the
  exact 6 public exports + schema type names.
- **Stage 7 ⬜ Release tooling swap** — release-please → semantic-release + OIDC; land the breaking
  changes (peer `^5 || ^6`, ESM-only `dist/`) as **5.0.0**; verify version continuity from 4.7.2 via
  `semantic-release --dry-run`.

## Stage 4 — Data port (the immediate next work)

Goal: decouple components/hooks from `useListeningQuery`/`useClient` via one `TaxonomyDataPort`,
defaulting to a behavior-identical `StudioDataAdapter`; make the tree update reactively on mutation
(see Known issues); delete the `config.ts` singleton; give `ReleaseContext` a real type.

- `core/ports.ts` — `TaxonomyDataPort` interface (pure types): `watchTree`, `fetchSchemeRefs`,
  `fetchBranchConcepts`, `applyConceptPlan`, `querySemanticRecommendations` (the embeddings seam;
  its impl swaps in Stage 5, the interface stays).
- `seams/StudioDataAdapter.ts` — implements the port with today's `useListeningQuery` + client
  transactions (replaying `core/mutations` plans) + the existing embeddings code (carried unchanged;
  replaced in Stage 5). Behavior-identical default.
- `test/FakeDataPort.ts` — in-memory fake returning fixtures synchronously, so Layer A/C tests run
  fast without a Studio.
- Thin port-backed hooks (`useTaxonomyTree`, `useApplyConceptPlan`, `useEmbeddingsQuery`), provided
  via React context — **this also replaces the `config.ts` `getPluginConfig()` singleton** (pass
  `ident` through context/props). Re-point `Hierarchy`/`InputHierarchy`/input components/mutation
  hooks to the port.
- **Tree-update-on-removal fix** (Andy-flagged): when reworking the live-query seam, make the tree
  reflect a removal instantly — optimistic update, or corrected listen/perspective handling.
- Verify: component + tree tests against `FakeDataPort`; one integration test per seam; `pnpm dev`
  full manual pass of create/remove/add-reference/browse-only across draft + release + published.

## Known issues / cleanup carried forward

- **Tree View doesn't update instantly on concept removal** (PRE-EXISTING — confirmed not a Stage 3
  regression: removal transaction is byte-identical and `Hierarchy.tsx`'s `useListeningQuery` is
  untouched; create masks the same lag by navigating away via `openInNewPane`). Fix in Stage 4.
- **`config.ts` singleton** (`getPluginConfig`/`setPluginConfig`) — hidden global read by
  `useCreateConcept` for `ident`; replace with context in Stage 4.
- **Phantom `@sanity/*` deps** (`@sanity/uuid`, `@sanity/util`) — currently exposed via `.npmrc`
  public-hoist (sanity's own copies). Make explicit or import from `sanity` when their consumers are
  refactored (Stage 4).
- **11 stale `eslint-disable` directives** (warnings) in components/helpers/types/views — remove as
  those files are touched.
- **`react/no-unescaped-entities`** turned off for the schema description JSX — revisit when schemas
  move to `src/schema/`.

## Key files / where things are

- `src/core/*` — the tested pure core (see Architecture). `src/index.ts` — the 6 public exports.
- `src/structure.ts` — the `'taxonomy'` structure tool + `defaultDocumentNode`.
- `studio/` — the dev studio (`sanity.config.ts`, `sanity.cli.ts` w/ `vite-tsconfig-paths` + dedupe,
  `schemaTypes.ts` wiring a sample `article` to scheme `f3deba` in the `dev` dataset).
- Config: `package.config.ts`, `tsconfig.settings.json`/`.json`/`.dist.json`, `eslint.config.mjs`,
  `commitlint.config.mjs`, `lint-staged.config.mjs`, `.npmrc`, `.husky/`.
