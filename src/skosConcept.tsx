/**
 * Sanity document scheme for SKOS Taxonomy Concepts
 * @todo Improve typings
 * @todo Hierarchy, Broader, & Associated: enforce disjointedness between Associated and BroaderTransitive (integrity constraint); prohibit cycles in hierarchical relations (best practice).
 *       2022-03-31: Filtering added to Related to five levels of hierarchy, document filtering present for Broader.  Consider more robust filtering and validation for future releases.
 * @todo Document level validation for the disjunction between Preferred, Alternate, and Hidden Labels
 * @todo Lexical labels: add child level validation so that offending labels are shown directly when a duplicate is entered. Then consider removing document level validation. cf. https://www.sanity.io/docs/validation#9e69d5db6f72
 * @todo Scheme initial value: Configure "default" option in Concept Scheme, for cases when there are multiple schemes; configure initialValue to default to that selection (It's currently configure to take the scheme ordered first. This isn't transparent.)
 * @todo Abstract broader and related concept filter into reusable function, and/or add in validation to cover wider scenarios.
 */

// import config from 'config:taxonomy-manager'
import {AiFillTag, AiFillTags} from 'react-icons/ai'
import {defineType, defineField} from 'sanity'
import {DescriptionDetail} from './styles'
import baseIriField from './modules/baseIriField'
import {randomKey} from '@sanity/util/content'

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
  fields: [
    defineField({
      name: 'conceptId',
      title: 'Concept ID',
      type: 'string',
      initialValue: () => `c_${randomKey(6)}`,
      hidden: true,
      readOnly: true,
    }),
    defineField({
      name: 'prefLabel',
      title: 'Preferred Label',
      type: 'string',
      description:
        'The preferred lexical label for this concept. This label is also used to unambiguously represent this concept via the concept IRI.',
      // If there is a published concept with the current document's prefLabel, return an error message, but only for concepts with distinct _ids — otherwise editing an existing concept shows the error message as well.
      validation: (Rule) =>
        Rule.required().custom((prefLabel, context) => {
          const {getClient} = context
          const client = getClient({apiVersion: '2022-12-14'})
          return client
            .fetch(
              `*[_type == "skosConcept" && prefLabel == "${prefLabel}" && !(_id in path("drafts.**"))][0]._id`
            )
            .then((conceptId) => {
              if (conceptId && conceptId !== context.document?._id.replace('drafts.', '')) {
                return 'Preferred Label must be unique.'
              }
              return true
            })
        }),
    }),
    ...baseIriField,
    defineField({
      name: 'conceptIriBase',
      title: 'Edit the base IRI',
      type: 'baseIri',
      // this field is visible only if a conceptIriBase using the old scheme is present
    }),
    defineField({
      name: 'broader',
      title: 'Broader Concept(s)',
      description:
        'Broader relationships create a hierarchy between concepts, for example to create category/subcategory, part/whole, or class/instance relationships.',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: {type: 'skosConcept'},
          options: {
            filter: ({document}: {document: any}) => {
              return {
                // Broader filter only performs document-level validation for broader-transitive/related disjunction.
                // Consider adding custom validation to prevent broader taxonomy inconsistencies.
                filter:
                  '!(_id in $broader || _id in $related || _id in path("drafts.**") || _id == $self)',
                params: {
                  self: document._id.replace('drafts.', ''),
                  broader: document.broader.map(({_ref}: {_ref: any}) => _ref),
                  related: document.related.map(({_ref}: {_ref: any}) => _ref),
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
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'skosConcept'}],
        },
      ],
    }),
    defineField({
      name: 'altLabel',
      title: 'Alternate Label(s)',
      type: 'array',
      description:
        'Alternative labels can be used to assign synonyms, near-synonyms, abbreviations, and acronyms to a concept. Preferred, alternative, and hidden label sets must not overlap.',
      of: [{type: 'string'}],
      validation: (Rule) => Rule.unique(),
    }),
    defineField({
      name: 'hiddenLabel',
      title: 'Hidden Label(s)',
      type: 'array',
      description:
        'Hidden labels are for character strings that need to be accessible to applications performing text-based indexing and search operations, but not visible otherwise. Hidden labels may for instance be used to include misspelled variants of other lexical labels. Preferred, alternative, and hidden label sets must not overlap.',
      of: [{type: 'string'}],
      validation: (Rule) => Rule.unique(),
    }),
    defineField({
      name: 'scopeNote',
      title: 'Scope Note',
      type: 'text',
      description:
        'A brief statement on the intended meaning of this concept, especially as an indication of how the use of the concept is limited in indexing practice',
      rows: 3,
    }),
    defineField({
      name: 'definition',
      title: 'Definition',
      type: 'text',
      description: 'A complete explanation of the intended meaning of the concept',
      rows: 3,
    }),
    defineField({
      name: 'example',
      title: 'Examples',
      type: 'text',
      description: 'An example of the use of the concept.',
      rows: 3,
    }),
    defineField({
      name: 'historyNote',
      title: 'History Notes',
      type: 'text',
      description: (
        <details>
          <summary>Significant changes to the meaning of the form of this concept.</summary>
          <DescriptionDetail>
            <kbd>
              Example: childAbuse
              <br />
              History Note: "Estab. 1975; heading was: Cruelty to children [1952 - 1975]."
            </kbd>
            <p>
              For more information on the recommended usage of the SKOS documentation properties,
              see
              <a
                href="https://www.w3.org/TR/2009/NOTE-skos-primer-20090818/#secdocumentation"
                target="_blank"
                rel="noreferrer"
              >
                {' '}
                W3C SKOS Primer: 2.4 Documentary Notes
              </a>
            </p>
          </DescriptionDetail>
        </details>
      ),
      rows: 3,
    }),
    defineField({
      name: 'editorialNote',
      title: 'Editorial Notes',
      type: 'text',
      description: (
        <details>
          <summary>
            Information to aid in administrative housekeeping, such as reminders of editorial work
            still to be done, or warnings in the event that future editorial changes might be made.
          </summary>
          <DescriptionDetail>
            <kbd>
              Example: doubleclick
              <br />
              Editorial Note: "Review this term after the company merger is complete."
            </kbd>
            <p>
              For more information on the recommended usage of the SKOS documentation properties,
              see
              <a
                href="https://www.w3.org/TR/2009/NOTE-skos-primer-20090818/#secdocumentation"
                target="_blank"
                rel="noreferrer"
              >
                {' '}
                W3C SKOS Primer: 2.4 Documentary Notes
              </a>
            </p>
          </DescriptionDetail>
        </details>
      ),
      rows: 3,
    }),
    defineField({
      name: 'changeNote',
      title: 'Change Notes',
      type: 'text',
      description: (
        <details>
          <summary>
            Fine-grained changes to a concept, for the purposes of administration and maintenance.
          </summary>
          <DescriptionDetail>
            <kbd>
              Example: tomato
              <br />
              Change Note: "Moved from under 'fruits' to under 'vegetables' by Horace Gray"
            </kbd>
            <p>
              For more information on the recommended usage of the SKOS documentation properties,
              see
              <a
                href="https://www.w3.org/TR/2009/NOTE-skos-primer-20090818/#secdocumentation"
                target="_blank"
                rel="noreferrer"
              >
                {' '}
                W3C SKOS Primer: 2.4 Documentary Notes
              </a>
            </p>
          </DescriptionDetail>
        </details>
      ),
      rows: 3,
    }),
    defineField({
      name: 'topConcept',
      title: 'Top Concept',
      type: 'boolean',
      description: (
        <>
          NOTE: Top Concepts are determined at the Concept Scheme for version 2 of this plugin.
          Please migrate this value accordingly. This field will be removed in future versions of
          this plugin. To hide it in the meantime, set Top Concept to "false."
          <br />
          <br />
          Description: Top concepts provide an efficient entry point to broader/narrower concept
          hierarchies and/or top level facets. By convention, resources can be a Top Concept, or
          have Broader relationships, but not both.
        </>
      ),
      hidden: ({document}) => !document?.topConcept,
    }),
    defineField({
      name: 'scheme',
      title: 'Concept Scheme(s)',
      type: 'reference',
      hidden: ({document}) => !document?.scheme,
      description: (
        <>
          NOTE: Concept Scheme inclusion is are determined from the Concept Scheme for version 2 of
          this plugin. Please migrate this value accordingly. This field will be removed in future
          versions of this plugin. To hide it in the meantime, unset this value (delete it).
          <br />
          <br />
          Description: Concept schemes are used to group concepts into defined sets, such as
          thesauri, classification schemes, or facets.
        </>
      ),
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
      broader0: 'broader.0.prefLabel',
      broader1: 'broader.1.prefLabel',
      broader2: 'broader.2.prefLabel',
    },
    prepare({title, broader0, broader1, broader2}) {
      const subtitle = [broader0, broader1].filter(Boolean).join(', ') + (broader2 ? ' ...' : '')
      return {
        title: title,
        subtitle: broader0 ? `in ${subtitle}` : subtitle,
        media: AiFillTag,
      }
    },
  },
})
