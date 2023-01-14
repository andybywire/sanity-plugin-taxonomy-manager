/**
 * Base Internationalized Resource Identifier object for Sanity Taxonomy Manager
 * This field is created as an object in order to present it as collapsed in the Sanity Studio UI.
 * @todo Remove this object after a transitional period (from the release of V2.0) to allow anyone using the plugin to convert vocabularies to the new schema.
 */

import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'baseIri',
  title: 'Base IRI',
  type: 'object',
  description: 'NOTE: conceptIriBase.iriValue is deprecated in version 2 of this plugin. Please migrate this value to the baseIri field above. This field will be removed in future versions of this plugin. To hide it in the meantime, unset this value (delete it).',
  hidden: ({document}: {document: any}) => !document?.conceptIriBase?.iriValue,
  fields: [
    defineField({
      name: 'iriValue',
      title: 'IRI Value',
      type: 'url',
      description:
        'Description: The W3C encourages the use of HTTP URIs when minting concept URIs since they are resolvable to representations that can be accessed using standard Web technologies.',
    }),
  ],
  options: {
    collapsible: true,
    collapsed: false,
  },
})
