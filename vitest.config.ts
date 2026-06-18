import {defineConfig} from 'vitest/config'

export default defineConfig({
  // Use the automatic JSX runtime via esbuild so we don't need
  // @vitejs/plugin-react (which can pin a conflicting Vite version).
  esbuild: {jsx: 'automatic'},
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['**/node_modules/**', '**/lib/**'],
  },
})
