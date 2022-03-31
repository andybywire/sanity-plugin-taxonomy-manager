/**
 * Sanity document scheme for SKOS Taxonomy Concepts
 * @todo PrefLabel: add document level validation that prevents the creation of two concepts with the same PrefLabel
 * @todo Hierarchy, Broader, & Associated: enforce disjointedness between Associated and BroaderTransitive (integrity constraint); prohibit cycles in hierarchical relations (best practice) 2022-03-31: Filtering added to Related to five levels of hierarchy, document filtering present for Broader. 
 * @todo Lexical labels: add child level validation so that offending labels are shown directly when a duplicate is entered. Then consider removing document level validation. cf. https://www.sanity.io/docs/validation#9e69d5db6f72
 * @todo Scheme initial value: Configure "default" option in Concept Scheme; configure initialValue to default to that selection.
 * @todo Abstract broader and related concept filter into reusable function, and/or add in validation to cover wider scenarios.
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
      broader: [],     // an empty array is needed here in order to return concepts with no "broader" for "related"
      related: []
    }
  },
  // Document level validation for the disjunction between Preferred, Alternate, and Hidden Labels:
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
      // If there is a published concept with the current document's prefLabel, return an error message, but only for concepts with distinct _ids — otherwise editing an existing concept shows the error message as well. 
      validation: Rule => Rule.required().custom((prefLabel, context) => {
        return client.fetch(`*[_type == "skosConcept" && prefLabel == "${prefLabel}" && !(_id in path("drafts.**"))][0]._id`)
          .then(conceptId => {
            if (conceptId && conceptId !== context.document._id.replace('drafts.', '')) {
              return 'Preferred Label must be unique.'
            } else {
              return true
            }
          })
        }),
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
                // Broader filter only performs document-level validation for broader-transitive/related disjunction.
                // Consider adding custom validation to prevent broader taxonomy inconsistencies.
                filter:
                  '!(_id in $broader || _id in $related || _id in path("drafts.**") || _id == $self)',
                params: {
                  self: document._id.replace('drafts.', ''),
                  broader: document.broader.map(({_ref}) => _ref),
                  related: document.related.map(({_ref}) => _ref),
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
            filter: async ({document}) => {
              let broaderTrans = [];
              try {
                // This filter checks for inconsistencies to five levels of hierarchy. Consider adding custom validation to prevent broader taxonomy inconsistencies.
                // This block starts for the document in question, and looks up the hierarchy tree. Those found to have the document in question as a "broader transitive" are added to a list of concepts to exclude from  potential "Related Concept" candidates.
                const response = await client.fetch(`*[_type == "skosConcept" && prefLabel == "${document.prefLabel}"]{prefLabel,broader[]->{prefLabel,broader[]->{prefLabel,broader[]->{prefLabel,broader[]->{prefLabel,broader[]->{prefLabel}}}}}}`);
                // console.log(response); // for troubleshooting
                broaderTrans = 
                await response.flatMap(broader =>
                                  broader.broader?.flatMap(broader => broader.prefLabel)
                                ) // first broader term 
                                .concat(response.flatMap(broader => 
                                  broader.broader?.flatMap(broader => 
                                    broader.broader?.flatMap(broader => broader.prefLabel)))
                                ) // second broader term 
                                .concat(response.flatMap(broader => 
                                  broader.broader?.flatMap(broader => 
                                    broader.broader?.flatMap(broader => 
                                      broader.broader?.flatMap(broader => broader.prefLabel))))
                                ) // third broader term 
                                .concat(response.flatMap(broader => 
                                  broader.broader?.flatMap(broader => 
                                    broader.broader?.flatMap(broader => 
                                      broader.broader?.flatMap(broader => 
                                        broader.broader?.flatMap(broader => broader.prefLabel)))))
                                ) // fourth broader term 
                                .concat(response.flatMap(broader => 
                                  broader.broader?.flatMap(broader => 
                                    broader.broader?.flatMap(broader => 
                                      broader.broader?.flatMap(broader => 
                                        broader.broader?.flatMap(broader => 
                                          broader.broader?.flatMap(broader => broader.prefLabel))))))
                                ) // fifth broader term 
                                .filter(broader => broader) // remove "undefined"
                // console.log(broaderTrans); // for troubleshooting

                // The 'broader[]->...' filters below look for the document in question in the broader-transitive path of the remaining concepts and, if found, excludes them from inclusion as a potential "Related Concept" candidate
                return {
                  filter:
                    `!(_id in $related || 
                      _id in path("drafts.**") || 
                      _id == $self ||
                      prefLabel in $broaderTrans ||  
                      $self in broader[]->._id ||
                      $self in broader[]->broader[]->._id ||
                      $self in broader[]->broader[]->broader[]->._id ||
                      $self in broader[]->broader[]->broader[]->broader[]->._id ||
                      $self in broader[]->broader[]->broader[]->broader[]->broader[]->._id
                      )`,
                  params: {
                    self: document._id.replace('drafts.', ''),
                    related: document.related.map(({_ref}) => _ref),
                    broaderTrans: broaderTrans
                  },
                }
              } 
              catch(error) {
                console.error(`Could not get broader concepts: ${error}`);
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
