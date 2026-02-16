import {definePlugin} from 'sanity'
import {structureTool} from 'sanity/structure'

import {ReferenceHierarchyInput, ArrayHierarchyInput} from './components/inputs'
import {TreeView} from './components/TreeView'
import {setPluginConfig} from './config'
import {schemeFilter, branchFilter} from './helpers'
import skosConcept from './skosConcept'
import skosConceptScheme from './skosConceptScheme'
import NodeTree from './static/NodeTree'
import {defaultDocumentNode, structure} from './structure'
import type {Options} from './types'

/**
 * #### Sanity Taxonomy Manager
 * Defines a Sanity plugin for managing SKOS compliant taxonomies in Sanity Studio.
 * #### Options
 * @param baseUri - The base URI to use for SKOS concepts and concept schemes. BaseURI should follow an IANA http/s scheme and should terminate with either a / or #.
 * @param customConceptFields - An array of additional fields to add to the skosConcept type.
 * @param customSchemeFields - An array of additional fields to add to the skosConceptScheme type.
 * #### Identifier Configuration
 * @param ident.pattern - The character set to use for identifiers (default: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz').
 * @param ident.length - The length of the generated identifier (default: 6).
 * @param ident.prefix - A prefix to prepend to generated identifiers, for example to use Wikidata style IDs like "Q27521" (default: '').
 * @param ident.regenUi - Whether to display the "Create Unique Identifier" button in the UI by default.
 * @returns A Sanity plugin object.
 */
const taxonomyManager = definePlugin((options?: Options) => {
  const {baseUri, customConceptFields, customSchemeFields, ident} = options || {}

  // Store config for access in hooks
  setPluginConfig(options)

  return {
    name: 'taxonomyManager',
    options,
    schema: {
      types: [
        skosConcept(baseUri, customConceptFields, ident),
        skosConceptScheme(baseUri, customSchemeFields, ident),
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
