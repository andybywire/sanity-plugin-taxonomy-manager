/**
 * Sanity document scheme for SKOS Taxonomy Concepts
 * @todo PrefLabel: add document level validation that prevents the creation of two concepts with the same PrefLabel
 * @todo Hierarchy, Broader, & Associated: enforce disjointedness between Associated and BroaderTransitive (integrity constraint); prohibit cycles in hierarchical relations (best practice)
 * @todo Lexical labels: add child level validation so that offending labels are shown directly when a duplicate is entered. Then consider removing document level validation. cf. https://www.sanity.io/docs/validation#9e69d5db6f72
 * @todo Scheme initial value: Configure "default" option in Concept Scheme; configure initialValue to default to that selection.
 * @todo Abstract broader and related concept filter into reusable function. Need more clarity on what syntax "filter:" needs
 */
import sanityClient from 'part:@sanity/base/client'
import config from "config:taxonomy-manager"
import {AiFillTag, AiOutlineTag, AiFillTags} from 'react-icons/ai'
import PrefLabel from './components/prefLabel'

const client = sanityClient.withConfig({apiVersion: '2021-03-25'})

export default {
  name: 'skosConcept',
  title: 'Concepts',
  type: 'document',
  icon: AiFillTags,
  initialValue: async () => {
    const iriBase = {'iriValue': config.namespace}
    const scheme =
      (await client.fetch(`
      *[_type == 'skosConceptScheme']{
        '_type': 'reference',
        '_ref': _id
      }[0]
    `)) ?? undefined
    return {
      conceptIriBase: iriBase,
      scheme: scheme,
      topConcept: false,
    }
  },
  validation: (Rule) =>
    Rule.custom((fields) => {
      if (
        (fields.altLabel &&
          fields.hiddenLabel &&
          fields.altLabel.filter((label) => fields.hiddenLabel.includes(label)).length > 0) ||
        (fields.altLabel && fields.altLabel.includes(fields.prefLabel)) ||
        (fields.hiddenLabel && fields.hiddenLabel.includes(fields.prefLabel))
      )
        return 'Preferred Label, Alternate Labels, and Hidden Labels must all be unique. Please remove any labels duplicated across label types.'
      return true
    }),
  groups: [
    {
      name: 'relationship',
      title: 'Relationships',
    },
    {
      name: 'label',
      title: 'Labels',
    },
    {
      name: 'note',
      title: 'Documentation',
    },
  ],
  fields: [
    {
      name: 'prefLabel',
      title: 'Preferred Label',
      group: ['label', 'relationship'],
      type: 'string',
      description:
        'The preferred lexical label for this concept. This label is also used to unambiguously represent this concept via the concept IRI.',
      validation: (Rule) => Rule.required().error('Concepts must have a preferred label'),
      inputComponent: PrefLabel,
    },
    {
      name: 'conceptIriBase',
      title: 'Edit the base IRI',
      type: 'baseIri',
    },
    {
      name: 'altLabel',
      title: 'Alternate Label(s)',
      group: 'label',
      type: 'array',
      description:
        'Alternative labels can be used to assign synonyms, near-synonyms, abbreviations, and acronyms to a concept. Preferred, alternative, and hidden label sets must not overlap.',
      of: [{type: 'string'}],
      validation: (Rule) => Rule.unique(),
    },
    {
      name: 'hiddenLabel',
      title: 'Hidden Label(s)',
      group: 'label',
      type: 'array',
      description:
        'Hidden labels are for character strings that need to be accessible to applications performing text-based indexing and search operations, but not visible otherwise. Hidden labels may for instance be used to include misspelled variants of other lexical labels. Preferred, alternative, and hidden label sets must not overlap.',
      of: [{type: 'string'}],
      validation: (Rule) => Rule.unique(),
    },
    {
      name: 'topConcept',
      title: 'Top Concept',
      group: 'relationship',
      type: 'boolean',
      description:
        'Top concepts provide an efficient entry point to broader/narrower concept hierarchies and/or top level facets. By convention, resources can be a Top Concept, or have Broader relationships, but not both.',
      hidden: ({document}) => (document.broader ? document.broader.length > 0 : false),
    },
    {
      name: 'broader',
      title: 'Broader Concept(s)',
      hidden: ({document}) => document.topConcept,
      description:
        'Broader relationships create a hierarchy between concepts, for example to create category/subcategory, part/whole, or class/instance relationships.',
      group: 'relationship',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: {type: 'skosConcept'},
          options: {
            filter: ({document}) => {
              return {
                filter:
                  '!(_id in $broader || _id in $related || _id in path("drafts.**") || _id == $self)',
                params: {
                  self: document._id.replace('drafts.', ''),
                  broader: document.broader ? document.broader.map(({_ref}) => _ref) : [],
                  related: document.related ? document.related.map(({_ref}) => _ref) : [],
                },
              }
            },
          },
        },
      ],
    },
    {
      name: 'related',
      title: 'Related Concept(s)',
      description:
        'Associative links between concepts indicate that the two are inherently "related", but that one is not in any way more general than the other. Broader and Associated relationships are mutually exclusive.',
      group: 'relationship',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'skosConcept'}],
          options: {
            filter: ({document}) => {
              return {
                filter:
                  '!(_id in $broader || _id in $related || _id in path("drafts.**") || _id == $self)',
                params: {
                  self: document._id.replace('drafts.', ''),
                  broader: document.broader ? document.broader.map(({_ref}) => _ref) : [],
                  related: document.related ? document.related.map(({_ref}) => _ref) : [],
                },
              }
            },
          },
        },
      ],
    },
    {
      name: 'scheme',
      title: 'Concept Scheme(s)',
      group: 'relationship',
      type: 'reference',
      description:
        'Concept schemes are used to group concepts into defined sets, such as thesauri, classification schemes, or facets.',
      to: [
        {
          type: 'skosConceptScheme',
        },
      ],
      options: {
        disableNew: true,
      },
    },
    {
      name: 'scopeNote',
      title: 'Scope Note',
      type: 'text',
      description:
        'A brief statement on the intended meaning of this concept, especially as an indication of how the use of the concept is limited in indexing practice',
      rows: 3,
      group: 'note',
    },
    {
      name: 'definition',
      title: 'Definition',
      type: 'text',
      description: 'A complete explanation of the intended meaning of the concept',
      rows: 3,
      group: 'note',
    },
    {
      name: 'example',
      title: 'Examples',
      type: 'text',
      description: 'An example of the use of the concept.',
      rows: 3,
      group: 'note',
    },
  ],
  orderings: [
    {
      title: 'Top Concepts',
      name: 'topConcept',
      by: [
        {field: 'topConcept', direction: 'desc'},
        {field: 'prefLabel', direction: 'asc'},
      ],
    },
    {
      title: 'Preferred Label',
      name: 'prefLabel',
      by: [{field: 'prefLabel', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      title: 'prefLabel',
      topConcept: 'topConcept',
      broader: 'broader.0.prefLabel',
      broaderPlusOne: 'broader.0.broader.0.prefLabel',
      broaderPlusTwo: 'broader.0.broader.0.broader.0.prefLabel',
    },
    prepare({title, topConcept, broader, broaderPlusOne, broaderPlusTwo}) {
      const conceptBroader = [broaderPlusOne, broader].filter(Boolean)
      const broaderPath =
        conceptBroader.length > 0 ? `${conceptBroader.join(' ▷ ')} ▶︎ ${title}` : ''
      const hierarchy = broaderPlusTwo ? `... ${broaderPath}` : broaderPath
      return {
        title: title,
        subtitle: topConcept ? 'Top Concept' : hierarchy,
        media: topConcept ? AiOutlineTag : AiFillTag,
      }
    },
  },
}
