import studio from '@sanity/eslint-config-studio'
import globals from 'globals'
import prettier from 'eslint-config-prettier'

export default [
  {
    // Migrated from the legacy .eslintignore; flat config uses `ignores`.
    ignores: ['dist/**', 'coverage/**', 'studio/**', '_local/**', 'v2-incompatible.js'],
  },
  ...studio,
  prettier,
  {
    // Repo tooling that runs under Node, not in the Studio bundle: it needs the
    // Node globals (`console`, `process`) the browser-oriented studio config
    // doesn't provide. Linted rather than ignored — it gates releases.
    files: ['scripts/**/*.mjs'],
    languageOptions: {globals: globals.node},
  },
  {
    // Test files and test infra: allow intentional empty stub methods (jsdom
    // matchMedia/ResizeObserver shims), `any` in fixtures/mocks, and deep
    // describe/it nesting.
    files: ['**/*.test.ts', '**/*.test.tsx', 'src/test/**', 'src/test-setup.ts'],
    rules: {
      'typescript/no-empty-function': 'off',
      'typescript/no-explicit-any': 'off',
      'max-nested-callbacks': 'off',
    },
  },
]
