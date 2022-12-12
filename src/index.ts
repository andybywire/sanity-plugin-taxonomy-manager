import {definePlugin} from 'sanity'
import skosConcept from './skosConcept'
import skosConceptScheme from './skosConceptScheme'

export const taxonomyManager = definePlugin({
  name: 'taxonomyManager',
  title: 'Taxonomy Manager',
  schema: {types: [skosConcept, skosConceptScheme]},
})