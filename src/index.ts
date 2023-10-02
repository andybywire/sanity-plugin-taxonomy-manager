import {definePlugin} from 'sanity'
import {deskTool} from 'sanity/desk'
import skosConcept from './skosConcept'
import skosConceptScheme from './skosConceptScheme'
import TreeView from './components/TreeView'
import {schemeFilter, branchFilter, HierarchyInput} from './helpers'

import {defaultDocumentNode, structure} from './structure'
import NodeTree from './components/NodeTree'

interface Options {
  baseUri?: string
}

/**
 * Defines a Sanity plugin for managing taxonomies.
 * baseURI should follow an IANA http/s scheme and should terminate with either a / or #.
 * @returns A Sanity plugin object.
 */

// * @param options - Optional configuration options for the plugin.
// * @param options.baseUri - The base URI to use for SKOS concepts and concept schemes.

const taxonomyManager = definePlugin((options?: Options) => {
  const {baseUri} = options || {}

  return {
    name: 'taxonomyManager',
    options,
    schema: {
      types: [skosConcept(baseUri), skosConceptScheme(baseUri)],
    },
    plugins: [
      deskTool({
        name: 'taxonomy',
        title: 'Taxonomy',
        structure,
        defaultDocumentNode,
        icon: NodeTree,
      }),
    ],
  }
})

export {taxonomyManager, TreeView, schemeFilter, branchFilter, HierarchyInput}
