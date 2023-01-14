import {definePlugin} from 'sanity'
import skosConcept from './skosConcept'
import skosConceptScheme from './skosConceptScheme'
import baseIri from './objects/baseIri'

export const taxonomyManager = definePlugin({
  name: 'taxonomyManager',
  schema: {
    types: [
      skosConcept, 
      skosConceptScheme,
      baseIri
    ]
  }
})