import {WarningOutlineIcon} from '@sanity/icons'
import {DocumentId, getPublishedId} from '@sanity/id-utils'
import {nanoid} from 'nanoid'
import {AiOutlineTag, AiOutlineTags} from 'react-icons/ai'
import {defineType, defineField} from 'sanity'
import type {FieldDefinition, SanityDocument} from 'sanity'

import {Identifier} from './components/inputs'
import baseIriField from './helpers/baseIriField'
import {StyledDescription} from './styles'

const conceptFilter = ({document}: {document: SanityDocument}) => {
  const publishedId = getPublishedId(DocumentId(document._id))
  return {
    filter: '!(_id in $broader || _id in $related || _id == $self)',
    params: {
      self: publishedId,
      broader: Array.isArray(document?.broader)
        ? document.broader.map(({_ref}: {_ref: string}) => _ref)
        : [],
      related: Array.isArray(document?.related)
        ? document.related.map(({_ref}: {_ref: string}) => _ref)
        : [],
    },
  }
}

/**
 * Sanity document scheme for SKOS Taxonomy Concepts
 */
export default function skosConcept(baseUri?: string, customConceptFields: FieldDefinition[] = []) {
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
                }" && !(_id in path("drafts.**") || _id in path("versions.**"))][0]._id`
              )
              .then((conceptId) => {
                if (conceptId && !context.document?._id.includes(conceptId as string)) {
                  return 'Preferred Label must be unique.'
                }
                return true
              })
          }),
      }),
      defineField({
        name: 'definition',
        title: 'Definition',
        type: 'text',
        description: (
          <StyledDescription>
            <summary>A complete explanation of the intended meaning of the concept.</summary>
            <div>
              <kbd>
                Example: documentation
                <br />
                Definition: "The process of storing and retrieving information in all fields of
                knowledge."
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
            </div>
          </StyledDescription>
        ),
        rows: 3,
      }),
      defineField({
        name: 'example',
        title: 'Examples',
        type: 'text',
        description: (
          <StyledDescription>
            <summary>An example of the use of the concept.</summary>
            <div>
              <kbd>
                Example: organizations of science and culture
                <br />
                Example: "academies of science, general museums, world fairs"
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
            </div>
          </StyledDescription>
        ),
        rows: 3,
      }),
      defineField({
        name: 'scopeNote',
        title: 'Scope Note',
        type: 'text',
        description: (
          <StyledDescription>
            <summary>
              A brief statement on the intended meaning of this concept, especially as an indication
              of how the use of the concept is limited in indexing practice.
            </summary>
            <div>
              <kbd>
                Example: microwave frequencies
                <br />
                Scope Note: "Used for frequencies between 1Ghz and 300Ghz"
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
            </div>
          </StyledDescription>
        ),
        rows: 3,
      }),
      defineField({
        name: 'altLabel',
        title: 'Alternate Label(s)',
        type: 'array',
        description: (
          <StyledDescription>
            <summary>Synonyms, near-synonyms, abbreviations, and acronyms to a concept.</summary>
            <div>
              <p>
                <WarningOutlineIcon /> Preferred, alternative, and hidden label sets must not
                overlap.
              </p>
            </div>
          </StyledDescription>
        ),
        of: [{type: 'string'}],
        validation: (Rule) => Rule.unique(),
      }),
      defineField({
        name: 'hiddenLabel',
        title: 'Hidden Label(s)',
        type: 'array',
        description: (
          <StyledDescription>
            <summary>
              Character strings that need to be accessible to applications performing text-based
              indexing and search operations, but which should not be displayed to end users.
            </summary>
            <div>
              <p>
                Hidden labels may for instance be used to include misspelled variants of other
                lexical labels.
              </p>
              <p>
                <WarningOutlineIcon /> Preferred, alternative, and hidden label sets must not
                overlap.
              </p>
            </div>
          </StyledDescription>
        ),
        of: [{type: 'string'}],
        validation: (Rule) => Rule.unique(),
      }),
      ...baseIriField,
      defineField({
        name: 'conceptId',
        title: 'Identifier',
        description: 'This concept does not yet have a unique identifier.',
        type: 'string',
        initialValue: () => `${nanoid(6)}`,
        hidden: ({document}) => !!document?.conceptId,
        readOnly: ({document}) => !!document?.conceptId,
        components: {
          input: Identifier,
        },
      }),
      defineField({
        name: 'broader',
        title: 'Broader Concept(s)',
        description: (
          <StyledDescription>
            <summary>
              Create hierarchy between concepts, for example to create category/subcategory,
              part/whole, or class/instance relationships.
            </summary>
            <div>
              <p>Broader and Associated relationships are mutually exclusive.</p>
            </div>
          </StyledDescription>
        ),
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
        description: (
          <StyledDescription>
            <summary>
              Indicate that two concepts are inherently "related", but that one is not in any way
              more general than the other.
            </summary>
            <div>
              <p>Broader and Associated relationships are mutually exclusive.</p>
            </div>
          </StyledDescription>
        ),
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
        description: (
          <StyledDescription>
            <summary>Significant changes to the meaning or the form of this concept.</summary>
            <div>
              <kbd>
                Example: person with disabilities
                <br />
                History Note: "Estab. 1992; heading was: handicapped [1884 - 1992]."
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
            </div>
          </StyledDescription>
        ),
        rows: 3,
      }),
      defineField({
        name: 'editorialNote',
        title: 'Editorial Notes',
        type: 'text',
        description: (
          <StyledDescription>
            <summary>
              Information to aid in administrative housekeeping, such as reminders of editorial work
              still to be done, or warnings in the event that future editorial changes might be
              made.
            </summary>
            <div>
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
            </div>
          </StyledDescription>
        ),
        rows: 3,
      }),
      defineField({
        name: 'changeNote',
        title: 'Change Notes',
        type: 'text',
        description: (
          <StyledDescription>
            <summary>
              Fine-grained changes to a concept, for the purposes of administration and maintenance.
            </summary>
            <div>
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
            </div>
          </StyledDescription>
        ),
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
