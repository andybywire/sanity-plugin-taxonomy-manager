#!/usr/bin/env node
/**
 * Install smoke test. Packs the plugin, then installs the resulting tarball into
 * a throwaway Studio for **every Sanity version the peer range claims**, on
 * React 19. Fails if any install errors or emits peer-dependency warnings — i.e.
 * it verifies a real consumer can `npm install` the published package cleanly.
 *
 * It also asserts there is exactly **one copy** of `@sanity/ui` and of
 * `@sanity/icons` in the installed tree, and that the plugin and the Studio
 * resolve the *same* one. This is the check a plugin dev Studio structurally
 * cannot make: in a pnpm workspace (and in Vite's dev dep-optimizer) a single
 * bare specifier is shared app-wide, so a duplicate-major bug is invisible
 * locally while breaking real installs. That is exactly how 5.0.0 shipped with
 * a v3 `@sanity/ui` nested under the plugin next to the Studio's v4 — see
 * docs/development/decisions/0004-sanity-ui-v4.md.
 *
 * Scope: dependency resolution only. It does **not** assert Node `engines`
 * (`npm install` only warns on EBADENGINE unless engine-strict is set), and it
 * does not run the Studio: this catches the *shape* of the install, not runtime
 * behavior.
 *
 * Uses npm (not pnpm) for the install so it mirrors the most common consumer
 * setup. Run from the repo root:  node scripts/test-studio-install.mjs
 * (or: pnpm test:studio-install)
 */
import {execSync} from 'node:child_process'
import {existsSync, mkdirSync, readdirSync, realpathSync, rmSync, writeFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const testDir = path.join(root, 'tmp-studio-install-test')
const PKG = 'sanity-plugin-taxonomy-manager'

// The packages that must resolve to a single shared copy, and why a duplicate
// matters — the reason differs, so the failure output should too.
const SHARED_PACKAGES = [
  {
    name: '@sanity/ui',
    why:
      `Two copies mean two React contexts: the plugin's hooks won't see\n` +
      `            the Studio's providers (useToast no-ops, theming falls back).\n` +
      `            @sanity/ui must stay a peer dependency.`,
  },
  {
    name: '@sanity/icons',
    why:
      `Icons are stateless SVGs — no React context — so a duplicate is\n` +
      `            bundle bloat and version skew rather than breakage. It means the\n` +
      `            Studio has moved past our declared range: bump the @sanity/icons\n` +
      `            dependency to match.`,
  },
]

// Minimal but realistic Studios — carrying the deps a real `sanity` studio has
// and nothing padded, so a genuinely missing peer surfaces.
//
// Both ends of what the peer range claims. 6.9.2 is the floor: it is where
// `sanity` moved to @sanity/ui v4 (6.9.1 → ^3.5.1, 6.9.2 → ^4.0.1), so it proves
// the plugin works against 4.0.x and not merely against latest. Sanity 5 and
// Studio 6.0–6.9.1 ship UI v3 and are served by the 5.x line, so they are
// deliberately not tested here — adding them would assert support we don't claim.
const STUDIOS = [
  {
    name: 'Sanity 6.9.2 / React 19',
    deps: {
      react: '^19.2.0',
      'react-dom': '^19.2.0',
      sanity: '^6.9.2',
      'styled-components': '^6.1.0',
    },
  },
  {
    name: 'Sanity 6.15 / React 19',
    deps: {
      react: '^19.2.0',
      'react-dom': '^19.2.0',
      sanity: '^6.15.0',
      'styled-components': '^6.1.0',
    },
  },
]

function run(cmd, opts = {}) {
  return execSync(cmd, {encoding: 'utf8', stdio: 'pipe', ...opts})
}

function findTarball() {
  return readdirSync(root)
    .filter((f) => f.startsWith(`${PKG}-`) && f.endsWith('.tgz'))
    .map((f) => path.join(root, f))
}

// Every copy of `pkgName` in an installed tree, including ones nested under a
// package's own node_modules — which is exactly where a mis-declared dependency
// puts its private second copy.
function findCopies(nodeModulesDir, pkgName, found = []) {
  const direct = path.join(nodeModulesDir, ...pkgName.split('/'), 'package.json')
  if (existsSync(direct)) found.push(direct)

  let entries
  try {
    entries = readdirSync(nodeModulesDir, {withFileTypes: true})
  } catch {
    return found
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === '.bin') continue
    // Scoped packages nest one level deeper than unscoped ones.
    const pkgDirs = entry.name.startsWith('@')
      ? readdirSync(path.join(nodeModulesDir, entry.name), {withFileTypes: true})
          .filter((d) => d.isDirectory())
          .map((d) => path.join(nodeModulesDir, entry.name, d.name))
      : [path.join(nodeModulesDir, entry.name)]
    for (const dir of pkgDirs) {
      const nested = path.join(dir, 'node_modules')
      if (existsSync(nested)) findCopies(nested, pkgName, found)
    }
  }
  return found
}

// Assert one copy of `pkgName`, and that the plugin and the Studio actually
// resolve the same file. Same version can still be two installed copies, so
// compare realpaths rather than trusting the version alone.
function checkSingleCopy(dir, pkgName) {
  const nm = path.join(dir, 'node_modules')
  const copies = findCopies(nm, pkgName)
  const byVersion = new Map()
  for (const p of copies) {
    const {version} = createRequire(p)(p)
    byVersion.set(version, path.relative(dir, p))
  }

  if (byVersion.size === 0) {
    return {ok: false, detail: `${pkgName} not found in the installed tree`}
  }
  if (byVersion.size !== 1) {
    return {
      ok: false,
      detail:
        `expected exactly 1 copy of ${pkgName}, found ${byVersion.size}:\n` +
        [...byVersion].map(([v, p]) => `            ${v}  ${p}`).join('\n'),
    }
  }

  let pluginCopy, studioCopy
  try {
    pluginCopy = realpathSync(
      createRequire(path.join(nm, PKG, 'package.json')).resolve(`${pkgName}/package.json`),
    )
    studioCopy = realpathSync(
      createRequire(path.join(nm, 'sanity', 'package.json')).resolve(`${pkgName}/package.json`),
    )
  } catch (e) {
    return {ok: false, detail: `could not resolve ${pkgName} from both sides: ${e.message}`}
  }
  if (pluginCopy !== studioCopy) {
    return {
      ok: false,
      detail:
        `plugin and Studio resolve different ${pkgName} installs:\n` +
        `            plugin: ${path.relative(dir, pluginCopy)}\n` +
        `            studio: ${path.relative(dir, studioCopy)}`,
    }
  }
  return {
    ok: true,
    detail: `single ${pkgName} (${[...byVersion.keys()][0]}), shared by plugin and Studio`,
  }
}

// Install the packed plugin into a throwaway studio and report whether it
// installed cleanly with no peer-dependency problems, and with a single shared
// copy of each package in SHARED_PACKAGES. Cleans up its testDir on every path.
function installStudio(studio, tarball) {
  if (existsSync(testDir)) rmSync(testDir, {recursive: true})
  mkdirSync(testDir, {recursive: true})

  const pkg = {
    name: 'test-studio',
    private: true,
    dependencies: {...studio.deps, [PKG]: `file:${tarball}`},
  }
  writeFileSync(path.join(testDir, 'package.json'), JSON.stringify(pkg, null, 2))
  // npm walks up from cwd and would otherwise read the repo's .npmrc, whose
  // pnpm-only public-hoist-pattern keys make it warn once per line. Harmless,
  // but noisy enough to bury a real failure in the captured output.
  writeFileSync(path.join(testDir, '.npmrc'), 'audit=false\nfund=false\n')

  console.log(`\nInstalling into a throwaway ${studio.name} Studio…`)
  let ok = false
  let out = ''
  try {
    out = run('npm install 2>&1', {cwd: testDir})
    ok = true
  } catch (e) {
    out = e.stdout || e.stderr || e.message || ''
  }

  const hasPeerProblem = /unmet peer|ERESOLVE|could not resolve|peer dep/i.test(out)
  // Inspect the tree before tearing it down; only meaningful if install worked.
  const shared = ok
    ? SHARED_PACKAGES.map((p) => ({...p, result: checkSingleCopy(testDir, p.name)}))
    : []
  rmSync(testDir, {recursive: true, force: true})
  return {ok, hasPeerProblem, shared, out}
}

function reportStudio(studio, result) {
  const {ok, hasPeerProblem, shared, out} = result
  if (!ok) {
    console.error(`\n✗ ${studio.name}: install FAILED\n`)
    console.error(out.slice(-2500))
    return false
  }
  if (hasPeerProblem) {
    console.error(`\n✗ ${studio.name}: installed, but with peer-dependency problems\n`)
    const m = out.match(/.*(?:unmet peer|ERESOLVE|could not resolve|peer dep).*/i)
    if (m) console.error(m[0].slice(0, 800))
    return false
  }
  const broken = shared.filter((p) => !p.result.ok)
  if (broken.length) {
    for (const p of broken) {
      console.error(`\n✗ ${studio.name}: duplicate ${p.name} in the installed tree`)
      console.error(`            ${p.result.detail}`)
      console.error(`            ${p.why}`)
    }
    return false
  }
  console.log(`✓ ${studio.name}: installs cleanly, no peer-dependency problems`)
  for (const p of shared) console.log(`  └─ ${p.result.detail}`)
  return true
}

function main() {
  // Clean any stale tarball and pack a fresh one into the repo root. `pnpm pack`
  // runs prepublishOnly, which builds — no separate build step needed.
  findTarball().forEach((f) => rmSync(f, {force: true}))
  console.log('Building + packing the plugin…')
  run('pnpm pack --pack-destination .', {cwd: root})

  const tarballs = findTarball()
  if (tarballs.length !== 1) {
    console.error(`Expected exactly one ${PKG}-*.tgz in repo root, found ${tarballs.length}.`)
    process.exit(1)
  }
  const tarball = tarballs[0]
  console.log(`Tarball: ${path.basename(tarball)}`)

  // Run every studio (don't short-circuit) so one failure still reports the
  // status of the others; tidy up the shared tarball regardless of outcome.
  const failures = []
  try {
    for (const studio of STUDIOS) {
      if (!reportStudio(studio, installStudio(studio, tarball))) failures.push(studio.name)
    }
  } finally {
    rmSync(tarball, {force: true})
  }

  if (failures.length) {
    console.error(
      `\n✗ ${failures.length} of ${STUDIOS.length} studios failed: ${failures.join(', ')}`,
    )
    process.exit(1)
  }
  console.log(`\n✓ All ${STUDIOS.length} studios install cleanly, with a single shared @sanity/ui`)
  process.exit(0)
}

main()
