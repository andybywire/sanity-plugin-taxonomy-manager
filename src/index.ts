import {definePlugin} from 'sanity'
import skosConcept from './skosConcept'
import skosConceptScheme from './skosConceptScheme'
import baseIri from './objects/baseIri'
import TreeView from './components/TreeView'

const taxonomyManager = definePlugin({
  name: 'taxonomyManager',
  schema: {
    types: [skosConcept, skosConceptScheme, baseIri],
  },
})

export {taxonomyManager, TreeView}
