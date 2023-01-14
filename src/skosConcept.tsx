/**
 * Sanity document scheme for SKOS Taxonomy Concepts
 * @todo Improve typings
 * @todo Hierarchy, Broader, & Associated: enforce disjointedness between Associated and BroaderTransitive (integrity constraint); prohibit cycles in hierarchical relations (best practice). 
 *       2022-03-31: Filtering added to Related to five levels of hierarchy, document filtering present for Broader. Consider more robust filtering and validation for future releases.
 * @todo Document level validation for the disjunction between Preferred, Alternate, and Hidden Labels
 * @todo Lexical labels: add child level validation so that offending labels are shown directly when a duplicate is entered. Then consider removing document level validation. cf. https://www.sanity.io/docs/validation#9e69d5db6f72
 * @todo Scheme initial value: Configure "default" option in Concept Scheme, for cases when there are multiple schemes; configure initialValue to default to that selection (It's currently configure to take the scheme ordered first. This isn't transparent.)
 * @todo Abstract broader and related concept filter into reusable function, and/or add in validation to cover wider scenarios.
 */

// import config from 'config:taxonomy-manager'
import {AiFillTag, AiOutlineTag, AiFillTags} from 'react-icons/ai'
import { defineType, defineField } from 'sanity'
import { PrefLabel } from './components/PrefLabel'

export default defineType({
  name: 'skosConcept',
  title: 'Concept',
  type: 'document',
  icon: AiFillTags,
  initialValue: async (props, context) => {
    const {getClient} = context
    const client = getClient({apiVersion: '2021-03-25'})
    const baseIri =
      (await client.fetch(`
        *[_type == 'skosConcept' && defined(baseIri)]| order(_createdAt desc)[0].baseIri
      `)) ?? undefined
    return {
      baseIri: baseIri,
      broader: [], // an empty array is needed here in order to return concepts with no "broader" for "related"
      related: [], // an empty array is needed here in order to return concepts with no "broader" for "related"
    }
  },
  groups: [
    {
      name: 'label',
      title: 'Labels',
      default: true,
    },
    {
      name: 'relationship',
      title: 'Relationships',
    },
    {
      name: 'note',
      title: 'Documentation',
    },
  ],
  fields: [
    defineField({
      name: 'prefLabel',
      title: 'Preferred Label',
      group: 'label',
      type: 'string',
      description:
      'The preferred lexical label for this concept. This label is also used to unambiguously represent this concept via the concept IRI.',
      components: {
        input: PrefLabel
      },
      // If there is a published concept with the current document's prefLabel, return an error message, but only for concepts with distinct _ids — otherwise editing an existing concept shows the error message as well.
      validation: (Rule) =>
        Rule.required().custom((prefLabel, context) => {
          const {getClient} = context
          const client = getClient({ apiVersion: '2022-12-14'})
          return client
            .fetch(
              `*[_type == "skosConcept" && prefLabel == "${prefLabel}" && !(_id in path("drafts.**"))][0]._id`
            )
            .then((conceptId) => {
              if (conceptId && conceptId !== context.document?._id.replace('drafts.', '')) {
                return 'Preferred Label must be unique.'
              } else {
                return true
              }
            })
        }),
    }),
    defineField({
      name: 'baseIri',
      title: 'Base IRI',
      type: 'url',
      group: 'label',
      validation: Rule => Rule.required().error('Please supply a base IRI.'),
      description:
        'The W3C encourages the use of HTTP URIs when minting concept URIs since they are resolvable to representations that can be accessed using standard Web technologies.',
      options: {
        collapsible: true
      }
    }),
    defineField({
      name: 'conceptIriBase',
      title: 'Edit the base IRI',
      type: 'baseIri',
      group: 'label',
      // type: 'string'
    }),
    defineField({
      name: 'altLabel',
      title: 'Alternate Label(s)',
      group: 'label',
      type: 'array',
      description:
        'Alternative labels can be used to assign synonyms, near-synonyms, abbreviations, and acronyms to a concept. Preferred, alternative, and hidden label sets must not overlap.',
      of: [{type: 'string'}],
      validation: (Rule) => Rule.unique(),
    }),
    defineField({
      name: 'hiddenLabel',
      title: 'Hidden Label(s)',
      group: 'label',
      type: 'array',
      description:
        'Hidden labels are for character strings that need to be accessible to applications performing text-based indexing and search operations, but not visible otherwise. Hidden labels may for instance be used to include misspelled variants of other lexical labels. Preferred, alternative, and hidden label sets must not overlap.',
      of: [{type: 'string'}],
      validation: (Rule) => Rule.unique(),
    }),
    defineField({
      name: 'broader',
      title: 'Broader Concept(s)',
      description:
        'Broader relationships create a hierarchy between concepts, for example to create category/subcategory, part/whole, or class/instance relationships.',
      group: 'relationship',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: {type: 'skosConcept'},
          options: {
            filter: ({document}:{document: any}) => {
              return {
                // Broader filter only performs document-level validation for broader-transitive/related disjunction.
                // Consider adding custom validation to prevent broader taxonomy inconsistencies.
                filter:
                  '!(_id in $broader || _id in $related || _id in path("drafts.**") || _id == $self)',
                params: {
                  self: document._id.replace('drafts.', ''),
                  broader: document.broader.map(({_ref}:{_ref: any}) => _ref),
                  related: document.related.map(({_ref}:{_ref: any}) => _ref),
                },
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'related',
      title: 'Related Concept(s)',
      description:
        'Associative links between concepts indicate that the two are inherently "related", but that one is not in any way more general than the other. Broader and Associated relationships are mutually exclusive.',
      group: 'relationship',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'skosConcept'}]
        },
      ],
    }),
    defineField({
      name: 'scopeNote',
      title: 'Scope Note',
      type: 'text',
      description:
        'A brief statement on the intended meaning of this concept, especially as an indication of how the use of the concept is limited in indexing practice',
      rows: 3,
      group: 'note',
    }),
    defineField({
      name: 'definition',
      title: 'Definition',
      type: 'text',
      description: 'A complete explanation of the intended meaning of the concept',
      rows: 3,
      group: 'note',
    }),
    defineField({
      name: 'example',
      title: 'Examples',
      type: 'text',
      description: 'An example of the use of the concept.',
      rows: 3,
      group: 'note',
    }),
    defineField({
      name: 'topConcept',
      title: 'Top Concept',
      group: 'relationship',
      type: 'boolean',
      description:
        <>NOTE: Top Concepts are determined at the Concept Scheme for version 2 of this plugin. Please migrate this value accordingly. This field will be removed in future versions of this plugin. To hide it in the meantime, set Top Concept to "false."<br/><br/>Description: Top concepts provide an efficient entry point to broader/narrower concept hierarchies and/or top level facets. By convention, resources can be a Top Concept, or have Broader relationships, but not both.</>,
      hidden: ({document}) => !document?.topConcept
    }),
    defineField({
      name: 'scheme',
      title: 'Concept Scheme(s)',
      group: 'relationship',
      type: 'reference',
      hidden: ({document}) => !document?.scheme,
      description:
        <>NOTE: Concept Scheme inclusion is are determined from the Concept Scheme for version 2 of this plugin. Please migrate this value accordingly. This field will be removed in future versions of this plugin. To hide it in the meantime, unset this value (delete it).<br/><br/>Description: Concept schemes are used to group concepts into defined sets, such as thesauri, classification schemes, or facets.</>,
      to: [
        {
          type: 'skosConceptScheme',
        },
      ],
      options: {
        disableNew: true,
      },
    }),
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
})
