import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {projectId: 'zw90ihi2', dataset: 'dev'},
  deployment: {
    appId: 'plhyflt0jvg6bna51jaoccyg',
  },

  vite: {
    resolve: {
      tsconfigPaths: true,
      // Force single instances across the workspace so the plugin (loaded from
      // ../src) and the studio share one copy of these context-bearing packages.
      dedupe: ['react', 'react-dom', 'styled-components', '@sanity/ui', 'sanity'],
    },
  },
})
