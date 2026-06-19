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
  `chore/0-baseline-inventory` → … → `refactor/3-core-extraction` → `feat/4-data-port` →
  `feat/5-semantic-recs` (current HEAD; **Stage 5 code-complete, pending Andy's `pnpm dev` verify**).
  Start Stage 6 on a new branch off the current HEAD (e.g. `test/6-component-tests`). Pushing/PRs are
  Andy's call.
- **The gate (must be green before every commit):**
  `pnpm test && pnpm typecheck && pnpm build && pnpm lint`. Currently green — **80 tests / 15
  files**, 0 type errors, build clean, **lint 0 errors / 0 warnings**.
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
- **Impure seams** (Stage 4 ✅): the live tree query, concept mutations, and semantic
  recommendations now sit behind one `TaxonomyDataPort` (`core/ports.ts`), implemented by
  `seams/StudioDataAdapter.ts` and reached via `seams/TaxonomyPortContext` (default = the adapter, so
  prod needs no provider; tests inject `test/FakeDataPort.ts`). Intentionally **not** ported (still
  impure): `helpers/schemeFilter.ts`/`branchFilter.ts` (fetch closures, public API, already
  mocked-client tested) and the `inputs/ArrayHierarchyInput`/`ReferenceHierarchyInput` resource-doc
  patch (the "third mutation site"). `views/ConceptUseView.tsx` still calls `useListeningQuery`
  directly.
- **Thin component shell:** tree views + input components (jsdom interaction tests come in Stage 6).
- **Assembly:** `src/index.ts` (6 public exports — unchanged), `src/structure.tsx`.

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
- **Stage 4 ✅ Data port** — port + adapter + fake (`d790a2a`), mutations through the port +
  `config.ts` singleton removed (`3b12564`), add/remove aria-label fix (`19b5166`), tree watch
  through the port + component tests (`b3157fe`), embeddings seam (`8f9e088`), optimistic-removal fix
  (`91c1854`), `ReleaseContext` real type + lint cleanup (`b8e0c5e`), `@sanity/uuid` explicit dep
  (`b7a4eec`). **Code-complete; pending Andy's `pnpm dev` verify pass.** Scope = the "core three"
  seams (watch, mutate, embeddings); filters + the array-input resource patch were left by design.
  See detail below.
- **Stage 5 ✅ Semantic recommendations migration** — replaced the deprecated Embeddings Index API
  (`client.request('/embeddings-index/…')`, `text::embedding()`) with a GROQ
  `score(text::semanticSimilarity($searchQuery))` query in a new pure `core/semanticRecommendations.ts`,
  run through a thinned `useSemanticRecommendations` hook on a published-perspective client. Public
  `embeddingsIndex` option → `semanticSearch` (dropped `indexName`); `EmbeddingsResult` →
  `ConceptRecommendation {conceptId, score}` — clean breaks bundled into 5.0.0. Graceful degradation
  when a dataset has no embeddings (friendly notice, tree still renders). Display path
  (`annotateScores` → `_score`) unchanged. **Code-complete; pending Andy's `pnpm dev` verify.** See
  detail below.
- **Stage 6 ⬜ NEXT — Component interaction tests + assembly hardening** — jsdom tests for tree views +
  input components (gating, warnings, browse-only, duplicate toast); export-surface test pinning the
  exact 6 public exports + schema type names.
- **Stage 7 ⬜ Release tooling swap** — release-please → semantic-release + OIDC; land the breaking
  changes (peer `^5 || ^6`, ESM-only `dist/`) as **5.0.0**; verify version continuity from 4.7.2 via
  `semantic-release --dry-run`.

## Stage 4 — Data port (DONE — pending Andy's `pnpm dev` verify)

Decoupled components/hooks from `useListeningQuery`/`useClient` behind one `TaxonomyDataPort`. What
landed (the "core three" seams — watch, mutate, embeddings):

- `core/ports.ts` — the `TaxonomyDataPort` interface. Members are hooks (`useWatchTree`,
  `useApplyConceptPlan`, `useSemanticRecommendations`) because the watch wraps a hook.
- `seams/StudioDataAdapter.ts` — the default impl: today's `useListeningQuery` + client transactions
  replaying `core/mutations` plans + the existing embeddings hook (carried unchanged for Stage 5).
- `seams/TaxonomyPortContext.tsx` — `useTaxonomyDataPort()` with the adapter as the **default**, so
  prod needs no provider; tests inject `test/FakeDataPort.ts` (synchronous fixtures + recorded calls).
- `config.ts` singleton **removed** — `ident` flows from plugin options through a
  `createDefaultDocumentNode` factory into `TaxonomyConfigContext` around the structure Tree View.
- **Instant removal** — optimistic prune (`core/tree/pruneConcepts` + `OptimisticTreeContext`,
  reconciled against fresh listener data); `useRemoveConcept` marks on click, rolls back on error.
- `ReleaseContext` retyped to `string | undefined` (the perspective name); `as string` casts dropped.
- Tests: `FakeDataPort`, `pruneConcepts`, and `Hierarchy`/`InputHierarchy` component tests covering
  watch params, loading, render, removal-routes-to-port, and the optimistic disappearance.

**Watch-seam decision (investigated):** `useListeningQuery` is built on Studio's
`documentStore.listenQuery`, not raw `client.listen()` (which the docs steer toward backend use; the
"modern" reactive path is the deferred Live Content API / App SDK). Kept it — the port makes that a
one-file swap later.

**Before Stage 4 fully closes:** Andy's `pnpm dev` pass — create / remove / add-reference /
browse-only across draft · release · published, especially the instant removal. Deferred to Stage 6:
a full embeddings interaction test (needs an input-component harness mocking
`useClient`/`useFormValue`/`usePerspective`).

## Stage 5 — Semantic recommendations migration (DONE — pending Andy's `pnpm dev` verify)

Migrated term recommendations off the deprecated Embeddings Index API onto GROQ dataset embeddings.
Three commits on `feat/5-semantic-recs`:

- **`0743aa9` pure core** — `core/semanticRecommendations.ts` (+13 tests): `recommendationsQuery()`
  (`*[_type=="skosConcept"] | score(text::semanticSimilarity($searchQuery)) | order(_score desc)
  [0...$maxResults]`), `assembleQueryText()` (query-text join + empty-field validation, messages
  preserved verbatim), `toConceptRecommendations()` (rows → `{conceptId, score}`, published-id
  normalized), `recommendationsErrorMessage()` (embeddings-disabled vs generic).
- **`73a55fb` the swap** — `useSemanticRecommendations` hook (replaces `useEmbeddingsRecs`): reads form
  fields, runs the query on a published-perspective client (`withConfig`, memoized), maps via the
  core. Renames threaded everywhere: prop `embeddingsIndex` → `semanticSearch`, type
  `EmbeddingsIndexConfig` → `SemanticSearchConfig` (no `indexName`), `EmbeddingsResult` →
  `ConceptRecommendation`, port `triggerEmbeddingsSearch` → `triggerSearch`. Adapter wrapper
  collapsed; `useDataset` dropped.
- **`5a2d819` docs** — `docs/documentation.md` recommendations section rewritten for `semanticSearch`
  + dataset-embeddings CLI setup.

**Decisions (Andy steered the first three):** `semanticSearch`/`SemanticSearchConfig` name; new
`ConceptRecommendation {conceptId, score}` (sheds the dead `value.type`); surface a friendly
`recsError` when embeddings are off.

**Carried forward — need Andy's live confirmation:**
- **apiVersion** — pinned to `'vX'` (`SEMANTIC_API_VERSION` in the hook). `text::semanticSimilarity` is
  documented stable but its min dated version isn't published, and the MCP's GROQ version rejects it.
  No regression (the old embeddings code used `vX`). Pin to a dated version once confirmed live.
- **Embeddings-disabled error string** — the classifier matches `/embedding/i` on the error text
  (couldn't capture the real error shape from here). Widen if the live wording differs.
- **Perspective** — the query uses the **published** perspective (parity with the old published index).

**Verify steps (Andy):** in a dataset with embeddings enabled, configure a `reference`/`array` field
with `semanticSearch={{fieldReferences, maxResults}}`, fill the referenced fields, open the tree →
expect a match % on relevant terms; clear a referenced field → expect the "fill out …" notice; point
at a dataset without embeddings → expect the friendly "not enabled" notice with the tree still
rendering. The full embeddings interaction test stays deferred to Stage 6 (input-component harness).

## Known issues / cleanup carried forward

- ✅ **Tree View instant removal** — fixed in Stage 4 (optimistic prune, `core/tree/pruneConcepts` +
  `OptimisticTreeContext`). Pending Andy's live `pnpm dev` confirmation across draft · release ·
  published.
- ✅ **`config.ts` singleton** — removed in Stage 4; `ident` flows via `TaxonomyConfigContext` from a
  `createDefaultDocumentNode` factory.
- ✅ **Stale `eslint-disable` directives** — all removed; lint is warning-free.
- ◑ **Phantom `@sanity/*` deps** — `@sanity/uuid` is now an explicit dependency (`^3.0.2`).
  `@sanity/util` (`/paths` in `ConceptUseView`) is still `.npmrc`-hoisted; it is version-locked to
  `sanity`, so resolve it when that view is refactored (Stage 6).
- **`react/no-unescaped-entities`** turned off for the schema description JSX — revisit when schemas
  move to `src/schema/`.
- **Embeddings interaction test deferred to Stage 6** — a browse → trigger → scored-tree test needs
  the input-component harness; Stage 4 pinned the seam contract via `FakeDataPort` + typecheck.

## Key files / where things are

- `src/core/*` — the tested pure core (queries, ids, mutations, filters, validation, createId,
  `tree/annotateScores`, `tree/pruneConcepts`, and **`ports.ts`** the data-port interface).
  `src/index.ts` — the 6 public exports.
- `src/seams/` — `StudioDataAdapter.ts` (default port impl) + `TaxonomyPortContext.tsx`
  (`useTaxonomyDataPort`, default = the adapter). `src/test/FakeDataPort.ts` — the in-memory fake.
- `src/structure.tsx` — the `'taxonomy'` structure tool + `createDefaultDocumentNode(config)` factory
  (wraps the Tree View in `TaxonomyConfigContext` to pass `ident`). The old `config.ts` is removed.
- `studio/` — the dev studio (`sanity.config.ts`, `sanity.cli.ts` w/ `vite-tsconfig-paths` + dedupe,
  `schemaTypes.ts` wiring a sample `article` to scheme `f3deba` in the `dev` dataset).
- Config: `package.config.ts`, `tsconfig.settings.json`/`.json`/`.dist.json`, `eslint.config.mjs`,
  `commitlint.config.mjs`, `lint-staged.config.mjs`, `.npmrc`, `.husky/`.
