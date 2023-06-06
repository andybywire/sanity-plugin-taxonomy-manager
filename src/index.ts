import {definePlugin} from 'sanity'
import skosConcept from './skosConcept'
import skosConceptScheme from './skosConceptScheme'
import baseIri from './objects/baseIri'
import TreeView from './components/TreeView'
import {schemeFilter, branchFilter} from './helpers'

const taxonomyManager = definePlugin((options: any) => {
  const {baseUri} = options || {}

  return {
    name: 'taxonomyManager',
    options,
    schema: {
      types: [skosConcept(baseUri), skosConceptScheme(baseUri), baseIri],
    },
  }
})

export {taxonomyManager, TreeView, schemeFilter, branchFilter}
