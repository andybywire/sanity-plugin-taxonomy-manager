/**
 * Sanity document scheme for SKOS Concept Schemes
 * @todo Add administrative metadata: dc:title, dc:author ... date, last revised, etc.
 * @todo Add support for sorting array lists alphabetically (custom component?)
 * @todo Consider adding informational lists to this view (via custom input component): number of terms, list of terms, links.
 */

import {RiNodeTree} from 'react-icons/ri'
import {defineArrayMember, defineField, defineType} from 'sanity'
import baseIriField from './modules/baseIriField'
import {randomKey} from '@sanity/util/content'

export default function skosConceptScheme(baseUri?: string) {
  return defineType({
    name: 'skosConceptScheme',
    title: 'Concept Scheme',
    type: 'document',
    icon: RiNodeTree,
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
        name: 'schemeId',
        title: 'Scheme ID',
        type: 'string',
        initialValue: () => `${randomKey(6)}`,
        hidden: true,
        readOnly: true,
      }),
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
        name: 'topConcepts',
        title: 'Top Concepts',
        type: 'array',
        validation: (Rule) => Rule.unique(),
        of: [
          defineArrayMember({
            type: 'reference',
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
          media: RiNodeTree,
        }
      },
    },
  })
}
