/**
 * Sanity document scheme for SKOS Concept Schemes
 * @todo Add administrative metadata: dc:title, dc:author ... date, last revised, etc.
 * @todo Add support for sorting array lists alphabetically (custom component?)
 * @todo Consider adding informational lists to this view (via custom input component): number of terms, list of terms, links.
 */

import {defineArrayMember, defineField, defineType} from 'sanity'
import {randomKey} from '@sanity/util/content'
import baseIriField from './modules/baseIriField'
import {Identifier} from './components/inputs'
import NodeTree from './components/NodeTree'

export default function skosConceptScheme(baseUri?: string) {
  return defineType({
    name: 'skosConceptScheme',
    title: 'Concept Scheme',
    type: 'document',
    icon: NodeTree,
    initialValue: async (props, context) => {
      if (baseUri) return {baseIri: baseUri}
      const {getClient} = context
      const client = getClient({apiVersion: '2021-03-25'})
      const baseIri =
        (await client.fetch(`
        *[(_type == 'skosConcept' || _type == 'skosConceptScheme') && defined(baseIri)]| order(_createdAt desc)[0].baseIri
      `)) ?? undefined
      return {
        baseIri: baseIri,
      }
    },
    fields: [
      defineField({
        name: 'title',
        title: 'Title',
        type: 'string',
        description:
          'Taxonomy schemes group concepts into defined sets, such as thesauri, classification schemes, or facets. Concepts may belong on many (or no) concept schemes, and you may create as many (or few) concept schemes as you like',
      }),
      defineField({
        name: 'description',
        title: 'Description',
        type: 'text',
        rows: 5,
        description: 'Describe the intended use of this scheme.',
      }),
      defineField({
        name: 'controls',
        title: 'Concept Management Controls',
        description: 'Show concept management controls in hierarchy view',
        type: 'boolean',
        initialValue: true,
      }),
      ...baseIriField,
      defineField({
        name: 'schemeId',
        title: 'Identifier',
        description: 'This scheme does not yet have a unique identifier.',
        type: 'string',
        initialValue: () => `${randomKey(6)}`,
        hidden: ({document}) => !!document?.schemeId,
        readOnly: ({document}) => !!document?.schemeId,
        components: {
          input: Identifier,
        },
      }),
      defineField({
        name: 'topConcepts',
        title: 'Top Concepts',
        type: 'array',
        validation: (Rule) => Rule.unique(),
        of: [
          defineArrayMember({
            type: 'reference',
            // weak: true,
            to: [{type: 'skosConcept'}],
          }),
        ],
        options: {
          sortable: false,
        },
      }),
      defineField({
        name: 'concepts',
        title: 'Concepts',
        type: 'array',
        validation: (Rule) => Rule.unique(),
        of: [
          defineArrayMember({
            type: 'reference',
            // weak: true,
            to: [{type: 'skosConcept'}],
          }),
        ],
        options: {
          sortable: false,
        },
      }),
    ],
    preview: {
      select: {
        title: 'title',
      },
      prepare({title}) {
        return {
          title: title,
          media: NodeTree,
        }
      },
    },
  })
}
