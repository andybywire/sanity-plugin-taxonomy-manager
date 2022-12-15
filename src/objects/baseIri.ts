/**
 * Base Internationalized Resource Identifier object for Sanity Taxonomy Manager
 * This field is created as an object in order to present it as collapsed in the Sanity Studio UI.
 */

import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'baseIri',
  title: 'Base IRI',
  type: 'object',
  fields: [
    defineField({
      name: 'iriValue',
      title: 'IRI Value',
      type: 'url',
      description:
        'The W3C encourages the use of HTTP URIs when minting concept URIs since they are resolvable to representations that can be accessed using standard Web technologies.',
    }),
  ],
  options: {
    collapsible: true,
    collapsed: true,
  },
})
