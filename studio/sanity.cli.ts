import {defineCliConfig} from 'sanity/cli'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineCliConfig({
  api: {projectId: 'zw90ihi2', dataset: 'dev'},
  deployment: {
    appId: 'plhyflt0jvg6bna51jaoccyg',
  },

  vite: {
    // Resolve `sanity-plugin-taxonomy-manager` to ../src (per studio/tsconfig.json
    // paths) so edits to the plugin source hot-reload live. Vite ignores the
    // package's `source` export condition, so this alias is what makes HMR work.
    plugins: [tsconfigPaths()],
    // Force single instances across the workspace so the plugin (loaded from
    // ../src) and the studio share one copy of these context-bearing packages.
    resolve: {
      dedupe: ['react', 'react-dom', 'styled-components', '@sanity/ui', 'sanity'],
    },
  },
})
