/* eslint-disable */
import {defineConfig} from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()] as any,
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/testing/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/testing/', '**/*.d.ts', '**/*.config.*', '**/coverage/**'],
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
