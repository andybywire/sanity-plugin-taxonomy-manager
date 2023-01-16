import {definePlugin} from 'sanity'
import skosConcept from './skosConcept'
import skosConceptScheme from './skosConceptScheme'
import baseIri from './objects/baseIri'
import TreeView from './components/TreeView'


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

export const treeView = TreeView
