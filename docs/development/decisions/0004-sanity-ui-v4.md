# ADR 0004 — `@sanity/ui` v4 and the 6.0.0 peer floor

**Status:** accepted — supersedes the peer-range decision in
[ADR 0003](0003-5.0.0-platform-modernization.md).

## Context

ADR 0003 closed with a standing instruction: *"Re-verify the `@sanity/ui` / `sanity-plugin-utils`
compatibility whenever widening the `sanity` peer range."* This is that re-verification, and the
answer came back different from the v2 → v3 non-event.

**`sanity@6.9.2` moved its hard dependency from `@sanity/ui@3` to `@sanity/ui@4`** (6.9.1 → `^3.5.1`,
6.9.2 → `^4.0.1`). `sanity` *depends* on `@sanity/ui`, it does not peer it, so a consumer on a current
Studio got two copies — the Studio's v4 and, nested under the plugin, the v3 its `^3` peer asked for.
A dry-run install of published `5.0.0` against `sanity@6.15.0` confirmed it:

```
add @sanity/ui 3.5.5      add @sanity/icons 3.8.0     <- plugin
add @sanity/ui 4.2.1      add @sanity/icons 5.2.2     <- sanity
```

`@sanity/ui` carries React context (`ThemeProvider`, `LayerProvider`, `ToastProvider`). With two
instances the Studio renders v4's providers while the plugin's components read v3's, so **`useToast`
silently no-ops and theming falls back to defaults**. It fails at runtime, not at install — the worst
failure mode, and invisible to `pnpm build`.

Note the shape of the trap: the same dedupe that made the v2 → v3 migration a non-event (ADR 0003) is
exactly what stopped working here, because the two majors are no longer API-compatible.

## Decision

### Peers: `@sanity/ui ^4`, `sanity ^6.9.2` — dropping Sanity v5

`@sanity/ui` v4 only exists in Studio ≥ 6.9.2, and `sanity@5.31.2` (the last v5) pins `@sanity/ui ^3.2.0`.
One source tree cannot satisfy both, because v4's moved components live at subpaths that do not exist in
v3. So **v5 support is dropped** and `sanity` peers become `^6.9.2`. That is the breaking change that
makes this **6.0.0**; Sanity v5 users stay on plugin `5.x`.

Peers also tighten to `react`/`react-dom` `^19.2` (v4's `<Activity>` needs 19.2), `styled-components`
`^6.1`, and `engines.node` rises to `>=22.12` — all floors that v4 itself declares.

### Import moved components from subpaths — this is a convention, not a one-off

v4 pushed heavier components out of the root entry. The root still *exports* the names, but typed
`never`, so re-adding a root import fails typecheck rather than silently breaking:

```ts
import {Tooltip} from '@sanity/ui/tooltip'    // not '@sanity/ui'
import {useToast} from '@sanity/ui/toast'     // not '@sanity/ui'
```

Also moved (unused here, but the same rule applies): `Popover`, `Menu*`, `Autocomplete`, `Breadcrumbs`,
`Code`. `ThemeProvider`, `LayerProvider` and `Dialog` stay on the root; `buildTheme` stays on
`@sanity/ui/theme`.

### `@sanity/icons` v3 → v5, per-icon subpaths

Same duplicate-copy problem, same fix. v5 **removed every named export from the root entry** (they are
typed `never` with a deprecation pointing at the subpath), so all nine icons move:

```ts
import {AddCircleIcon} from '@sanity/icons/AddCircle'   // not '@sanity/icons'
```

### Do **not** import `@sanity/ui/styles.css` in the plugin

v4 extracts static styles to a stylesheet that must be imported **once, at the application entry**.
`sanity@6.15.0`'s `lib/index.js` already does it. A plugin importing it again is redundant and fights
`rollup-plugin-postcss`.

## What the migration actually cost

The plugin has **zero `styled-components` usage and zero `theme.sanity.*` access** — it styles entirely
through `@sanity/ui` props, inline `style`, and two CSS modules. So the entire v4 API surface reduced to
three mechanical changes, 46 type errors, and no test changes at all:

| Change | Sites |
|---|---|
| `Tooltip` → `@sanity/ui/tooltip` | 5 files |
| `useToast` / `ToastProvider` → `@sanity/ui/toast` | 7 files |
| `space` → `gap` (`Stack`, `Inline`; `space` is now `never`) | 32, in 13 files |
| `Grid columns` → `gridTemplateColumns` | 2 |

Dead weight removed on the way through: `@sanity/color` (never imported) and `react-fast-compare` (only
ever reachable via the inlined `sanity-plugin-utils@2.0.13`; `2.0.18` uses `dequal`).

## Gotchas (durable — these cost real time)

- **`sanity-plugin-utils` is inlined into `dist`.** It is a devDependency, so pkg-utils bundles it. `2.0.13`
  hard-deps `@sanity/ui@^3.4.3`; it must move to **`^2.0.18`** (`@sanity/ui@^4.0.7`) or the bundle embeds
  v3-era calls. This is easy to miss because nothing in `src/` references `@sanity/ui` v3 by then.
- **Tooltips and popovers now stay mounted when closed.** v4 wraps closed content in React's `<Activity>`
  and hides it with `visibility: hidden` instead of unmounting. Verified: closed tooltip content *is* in
  the DOM under test. `ConceptSelectLink.test.tsx` survives only because Testing Library's default exact
  match compares an element's whole normalized text — its tooltip reads `Select "X" (recommended)`, which
  is not `recommended`. **A future `getByText(/recommended/)` or `queryByText(/Select/)` will now match
  hidden tooltip content.** Assert visibility, not presence.
- **No build step can see a duplicate-copy problem.** `pnpm build`, `pnpm typecheck`, `pnpm test` and
  `pnpm --filter studio build` all pass with the bug present, because a pnpm workspace (and Vite's dev
  dep-optimizer) collapses one bare specifier app-wide — the duplicate only exists in a real consumer's
  `node_modules`. `sanityPlugin.verifyPackage.dependencies` is `false`, so `pkg-utils build --check`
  won't flag a stale peer range either. **`pnpm test:studio-install`**
  ([`scripts/test-studio-install.mjs`](../../../scripts/test-studio-install.mjs)) is the check that
  closes this: it packs the plugin, npm-installs it into throwaway Studios at both ends of the peer
  range (`sanity@^6.9.2` and `^6.15.0`), and asserts exactly one `@sanity/ui` and one `@sanity/icons`,
  shared by plugin and Studio. It runs as its own CI job and the release job depends on it. See
  [#97](https://github.com/andybywire/sanity-plugin-taxonomy-manager/issues/97).

## Consequences

- 6.0.0 targets **`sanity ^6.9.2` / `@sanity/ui` v4 / React 19.2 / Node 22.12**; Sanity v5 users stay on `5.x`.
- A PR gate (`.github/workflows/ci.yml`) now runs the full four-command gate plus the studio build.
  Previously nothing ran on PRs at all, which is how a peer-range drift like this could land unnoticed.
- The standing instruction from ADR 0003 still applies, and now has teeth: **re-verify `@sanity/ui`,
  `@sanity/icons` and `sanity-plugin-utils` whenever the `sanity` peer range moves** — and verify it with
  the dry-run install, not by reading `package.json`.
