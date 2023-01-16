/**
 * Sanity document scheme for SKOS Concept Schemes
 * @todo Add BaseIri field
 * @todo Add administrative metadata: dc:title, dc:author ... date, last revised, etc.
 * @todo Add support for sorting array lists alphabetically (custom component?)
 * @todo Consider adding informational lists to this view (via custom input component): number of terms, list of terms, links.
 */

import {RiNodeTree} from 'react-icons/ri'
import { defineArrayMember, defineField, defineType } from 'sanity';

export default defineType({
  name: 'skosConceptScheme',
  title: 'Concept Scheme',
  type: 'document',
  icon: RiNodeTree,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description:  'Taxonomy schemes group concepts into defined sets, such as thesauri, classification schemes, or facets. Concepts may belong on many (or no) concept schemes, and you may create as many (or few) concept schemes as you like'
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 5,
      description: 'Describe the intended use of this scheme.'
    }),
    defineField({
      name: 'topConcepts',
      title: 'Top Concepts',
      type: 'array',
      validation: Rule => Rule.unique(),
      of: [
        defineArrayMember({
          type: 'reference',
          to: [
            {type: 'skosConcept'}
          ]
        })
      ],
      options: {
        sortable: false
      }
    }),
    defineField({
      name: 'concepts',
      title: 'Concepts',
      type: 'array',
      validation: Rule => Rule.unique(),
      of: [
        defineArrayMember({
          type: 'reference',
          to: [
            {type: 'skosConcept'}
          ]
        })
      ],
      options: {
        sortable: false
      }
    })
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
