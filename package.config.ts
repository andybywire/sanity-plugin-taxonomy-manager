import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  dist: 'dist',
  tsconfig: 'tsconfig.dist.json',
  minify: true,
  babel: {
    // pkg-utils sees `styled-components` in peerDependencies and suggests the Babel
    // plugin. Nothing in `src/` imports it — it is a peer purely because `sanity`
    // requires one, so the plugin would have nothing to transform.
    styledComponents: false,
  },
  strictOptions: {
    // pkg-utils defaults this to `error`: it wants `@sanity/ui` in `dependencies`,
    // on the general principle that a plugin should pin what it renders with.
    // This package is the counter-example, and 6.0.0 exists because of it. As a
    // dependency, a consumer whose Studio is on UI v4 resolved a *second*, nested
    // copy under the plugin — two React context instances, so `useToast` no-ops
    // and theming silently falls back. A peer dependency is what forces the single
    // shared copy. `pnpm test:studio-install` asserts exactly that, against real
    // npm installs, and would fail if this moved. See ADR 0004.
    noSanityUiPeerDependency: 'off',
  },
  // Remove this block to enable strict export validation
  extract: {
    rules: {
      'ae-incompatible-release-tags': 'off',
      'ae-internal-missing-underscore': 'off',
      'ae-missing-release-tag': 'off',
    },
  },
})
