import {definePlugin} from 'sanity'
import {deskTool} from 'sanity/desk'
import skosConcept from './skosConcept'
import skosConceptScheme from './skosConceptScheme'
import baseIri from './objects/baseIri'
import TreeView from './components/TreeView'
import {schemeFilter, branchFilter} from './helpers'

import {structure} from './structure'
import {ActivityIcon} from '@sanity/icons' // replace w/ custom icon

interface Options {
  baseUri?: string
}
// tool name, list view name, don't show tool

/**
 * Defines a Sanity plugin for managing taxonomies.
 * @param options - Optional configuration options for the plugin.
 * @param options.baseUri - The base URI to use for SKOS concepts and concept schemes.
 * baseURI should follow an IANA http/s scheme and should terminate with either a / or #.
 * @returns A Sanity plugin object.
 */

const taxonomyManager = definePlugin((options?: Options) => {
  const {baseUri} = options || {}

  return {
    name: 'taxonomyManager',
    options,
    schema: {
      types: [skosConcept(baseUri), skosConceptScheme(baseUri), baseIri],
    },
    plugins: [
      deskTool({
        name: 'taxonomy',
        title: 'Taxonomy',
        structure,
        icon: ActivityIcon,
      }),
    ],
  }
})

export {taxonomyManager, TreeView, schemeFilter, branchFilter}
