import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {taxonomyManager} from 'sanity-plugin-taxonomy-manager'

import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'Taxonomy Manager — Dev',

  projectId: 'zw90ihi2',
  dataset: 'dev',
  deployment: {
    appId: 'plhyflt0jvg6bna51jaoccyg',
  },

  plugins: [
    // Default structure tool, so the sample `article` type is browsable.
    structureTool(),
    // The plugin under development — contributes the skosConcept /
    // skosConceptScheme types and its own "Taxonomy" structure tool.
    taxonomyManager({baseUri: 'https://example.com/'}),
    visionTool(),
  ],

  schema: {types: schemaTypes},
})
