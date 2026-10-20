import {defineConfig} from 'vitest/config'

export default defineConfig({
  // Use the automatic JSX runtime without @vitejs/plugin-react (which can pin a
  // conflicting Vite version). Vite 8 transforms with oxc, not esbuild, and oxc
  // honors the tsconfig's `jsx: "preserve"` — so this has to be set here or every
  // .tsx test fails to parse.
  oxc: {jsx: {runtime: 'automatic'}},
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['**/node_modules/**', '**/lib/**'],
  },
})
