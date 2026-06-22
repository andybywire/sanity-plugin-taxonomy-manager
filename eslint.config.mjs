import studio from '@sanity/eslint-config-studio'
import prettier from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'

export default [
  {
    // Migrated from the legacy .eslintignore; flat config uses `ignores`.
    ignores: ['dist/**', 'coverage/**', 'studio/**', '_local/**', 'v2-incompatible.js'],
  },
  ...studio,
  prettier,
  {
    // The studio config registers the TypeScript plugin under the name
    // `typescript`. Re-register the same plugin under the `@typescript-eslint`
    // alias so the existing inline eslint-disable comments (written against the
    // old plugin name) still resolve. Cleaned up during the Stage 3 refactor.
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {'@typescript-eslint': tseslint.plugin},
  },
  {
    rules: {
      // Schema field descriptions embed quoted example text in JSX; the prior
      // (v4.7.2) config did not enforce this. Keep it off and revisit when the
      // schema definitions move to src/schema/ in Stage 3.
      'react/no-unescaped-entities': 'off',
    },
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
