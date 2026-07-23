import {defineField} from 'sanity'

import {RdfUri} from '../components/inputs'

/**
 * #### Base Universal Resource Identifier object for Sanity Taxonomy Manager
 * Used for Concept and Concept Scheme URI fields
 */
export default [
  defineField({
    name: 'baseIri',
    title: 'Base URI',
    type: 'url',
    validation: (Rule) =>
      Rule.required().error(`Please supply a base URI in the format 'http://example.com/'`),
    description:
      'The root URI (Uniform Resource Identifier) used to create unique concept identifiers.',
    components: {
      input: RdfUri as any,
    },
  }),
]
