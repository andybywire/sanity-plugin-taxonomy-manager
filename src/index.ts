import {definePlugin, FieldDefinition} from 'sanity'
import {structureTool} from 'sanity/structure'
import skosConcept from './skosConcept'
import skosConceptScheme from './skosConceptScheme'
import TreeView from './components/TreeView'
import {schemeFilter, branchFilter} from './helpers'
import {ReferenceHierarchyInput, ArrayHierarchyInput} from './components/inputs'

import {defaultDocumentNode, structure} from './structure'
import NodeTree from './components/NodeTree'

interface Options {
  baseUri?: string
  customConceptFields?: FieldDefinition[]
  customSchemeFields?: FieldDefinition[]
}

/**
 * #### Defines a Sanity plugin for managing taxonomies
 * BaseURI should follow an IANA http/s scheme and should terminate with either a / or #.
 * @param options - Optional configuration options for the plugin.
 * @param options.baseUri - The base URI to use for SKOS concepts and concept schemes.
 * @param options.customConceptFields - An array of additional fields to add to the skosConcept type.
 * @param options.customSchemeFields - An array of additional fields to add to the skosConceptScheme type.
 * @returns A Sanity plugin object.
 */
const taxonomyManager = definePlugin((options?: Options) => {
  const {baseUri, customConceptFields, customSchemeFields} = options || {}

  return {
    name: 'taxonomyManager',
    options,
    schema: {
      types: [
        skosConcept(baseUri, customConceptFields),
        skosConceptScheme(baseUri, customSchemeFields),
      ],
    },
    plugins: [
      structureTool({
        name: 'taxonomy',
        title: 'Taxonomy',
        structure,
        defaultDocumentNode,
        icon: NodeTree,
      }),
    ],
  }
})

export {
  taxonomyManager,
  TreeView,
  schemeFilter,
  branchFilter,
  ReferenceHierarchyInput,
  ArrayHierarchyInput,
}
