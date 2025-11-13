import {defineConfig} from '@sanity/pkg-utils'
import postcss from 'rollup-plugin-postcss'

export default defineConfig({
  dist: 'lib',
  minify: true,
  legacyExports: true,
  // Remove this block to enable strict export validation
  extract: {
    rules: {
      'ae-forgotten-export': 'off',
      'ae-incompatible-release-tags': 'off',
      'ae-internal-missing-underscore': 'off',
      'ae-missing-release-tag': 'off',
    },
  },
  rollup: {
    plugins: [
      postcss({
        modules: true, // Enable CSS modules
        extract: false, // Don't extract to separate file, inject into JS
        inject: true, // Automatically inject styles
      }),
    ],
  },
})
