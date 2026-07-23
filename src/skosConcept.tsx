import {AiOutlineTag, AiOutlineTags} from 'react-icons/ai'
import {defineType, defineField} from 'sanity'

import {Identifier} from './components/inputs'
import {createId} from './core/createId'
import {conceptFilter, prefLabelUniquenessResult} from './core/validation'
import baseIriField from './helpers/baseIriField'
import type {Options} from './types'

/**
 * Sanity document scheme for SKOS Taxonomy Concepts
 */
export default function skosConcept(
  baseUri?: Options['baseUri'],
  customConceptFields: Options['customConceptFields'] = [],
  ident?: Options['ident'],
) {
  return defineType({
    name: 'skosConcept',
    title: 'Concept',
    type: 'document',
    icon: AiOutlineTags,
    initialValue: async (_, context) => {
      if (baseUri)
        return {
          baseIri: baseUri,
          broader: [], // an empty array is needed here in order to return concepts with no "broader" for "related"
          related: [], // an empty array is needed here in order to return concepts with no "broader" for "related"
        }

      const {getClient} = context
      const client = getClient({apiVersion: '2021-03-25'})
      const baseIri =
        (await client.fetch<string | null>(`
        *[(_type == 'skosConcept' || _type == 'skosConceptScheme') && defined(baseIri)]| order(_createdAt desc)[0].baseIri
      `)) ?? undefined
      return {
        baseIri: baseIri,
        broader: [], // an empty array is needed here in order to return concepts with no "broader" for "related"
        related: [], // an empty array is needed here in order to return concepts with no "broader" for "related"
      }
    },
    fields: [
      defineField({
        name: 'prefLabel',
        title: 'Preferred Label',
        type: 'string',
        description: 'The preferred lexical label for this concept.',
        validation: (Rule) =>
          Rule.required().custom((prefLabel, context) => {
            const {getClient} = context
            const client = getClient({apiVersion: '2025-06-10'}).withConfig({perspective: 'raw'})
            return client
              .fetch(
                `*[_type == "skosConcept" && prefLabel == "${
                  prefLabel as string
                }" && !(_id in path("drafts.**") || _id in path("versions.**"))][0]._id`,
              )
              .then((conceptId) =>
                prefLabelUniquenessResult(conceptId as string | null, context.document?._id),
              )
          }),
      }),
      defineField({
        name: 'definition',
        title: 'Definition',
        type: 'text',
        description: 'A complete explanation of the intended meaning of the concept.',
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
        name: 'scopeNote',
        title: 'Scope Note',
        type: 'text',
        description:
          'A brief statement on the intended meaning of this concept, especially as an indication of how the use of the concept is limited in indexing practice.',
        rows: 3,
      }),
      defineField({
        name: 'altLabel',
        title: 'Alternate Label(s)',
        type: 'array',
        description: 'Synonyms, near-synonyms, abbreviations, and acronyms to a concept.',
        of: [{type: 'string'}],
        validation: (Rule) => Rule.unique(),
      }),
      defineField({
        name: 'hiddenLabel',
        title: 'Hidden Label(s)',
        type: 'array',
        description:
          'Character strings that need to be accessible to applications performing text-based indexing and search operations, but which should not be displayed to end users.',
        of: [{type: 'string'}],
        validation: (Rule) => Rule.unique(),
      }),
      ...baseIriField,
      defineField({
        name: 'conceptId',
        title: 'Identifier',
        description:
          "Generate or re-generate the identifier for this concept according to parameters set in Taxonomy Manager plugin options. Note that this changes the concept's URI, which is not advisable if the concept is already in use in production. Use with caution.",
        type: 'string',
        initialValue: createId(ident),
        hidden: ({document}) => !!document?.conceptId && !ident?.regenUi,
        readOnly: ({document}) => !!document?.conceptId,
        components: {
          input: (props) => <Identifier {...props} ident={ident} />,
        },
      }),
      defineField({
        name: 'broader',
        title: 'Broader Concept(s)',
        description:
          'Create hierarchy between concepts, for example to create category/subcategory, part/whole, or class/instance relationships.',
        type: 'array',
        of: [
          {
            type: 'reference',
            to: {type: 'skosConcept'},
            options: {
              filter: conceptFilter,
            },
          },
        ],
      }),
      defineField({
        name: 'related',
        title: 'Related Concept(s)',
        description:
          'Indicate that two concepts are inherently "related", but that one is not in any way more general than the other.',
        type: 'array',
        of: [
          {
            type: 'reference',
            to: [{type: 'skosConcept'}],
            options: {
              filter: conceptFilter,
            },
          },
        ],
      }),
      ...customConceptFields,
      defineField({
        name: 'historyNote',
        title: 'History Notes',
        type: 'text',
        description: 'Significant changes to the meaning or the form of this concept.',
        rows: 3,
      }),
      defineField({
        name: 'editorialNote',
        title: 'Editorial Notes',
        type: 'text',
        description:
          'Information to aid in administrative housekeeping, such as reminders of editorial work still to be done, or warnings in the event that future editorial changes might be made.',
        rows: 3,
      }),
      defineField({
        name: 'changeNote',
        title: 'Change Notes',
        type: 'text',
        description:
          'Fine-grained changes to a concept, for the purposes of administration and maintenance.',
        rows: 3,
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
      },
      prepare({title}: {title: string}) {
        return {
          title: title,
          media: AiOutlineTag,
        }
      },
    },
  })
}
