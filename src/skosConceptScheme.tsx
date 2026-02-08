// import {nanoid} from 'nanoid'
// import type {FieldDefinition} from 'sanity'
import {defineArrayMember, defineField, defineType} from 'sanity'

import {Identifier, ManagementControls} from './components/inputs'
import baseIriField from './helpers/baseIriField'
import {createId} from './helpers/createId'
import NodeTree from './static/NodeTree'
import type {Options} from './types'

/**
 * Sanity document scheme for SKOS Concept Schemes
 */
export default function skosConceptScheme(
  baseUri?: Options['baseUri'],
  customSchemeFields: Options['customSchemeFields'] = [],
  ident?: Options['ident']
) {
  return defineType({
    name: 'skosConceptScheme',
    title: 'Concept Scheme',
    type: 'document',
    icon: NodeTree,
    initialValue: async (_, context) => {
      if (baseUri) return {baseIri: baseUri}
      const {getClient} = context
      const client = getClient({apiVersion: '2021-03-25'})
      const baseIri =
        (await client.fetch<string | null>(`
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
          'Taxonomy schemes group concepts into defined sets, such as thesauri, classification schemes, or facets. Concepts may belong to many (or no) concept schemes, and you may create as many (or few) concept schemes as you like',
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
        deprecated: {
          reason:
            'This field was used for a previous version of the plugin and is no longer needed. Remove the value to hide this field.',
        },
        type: 'boolean',
        readOnly: true,
        hidden: ({document}) => document?.controls === undefined,
        components: {
          input: ManagementControls,
        },
      }),
      ...baseIriField,
      defineField({
        name: 'schemeId',
        title: 'Identifier',
        description:
          "Generate or re-generate the identifier for this scheme according to parameters set in Taxonomy Manager plugin options. Note that this changes the concept's URI. Use with caution.",
        type: 'string',
        initialValue: createId(ident),
        hidden: ({document}) => !!document?.conceptId && !ident?.regenUi,
        readOnly: ({document}) => !!document?.conceptId,
        components: {
          input: (props) => <Identifier {...props} ident={ident} />,
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
      ...customSchemeFields,
    ],
    preview: {
      select: {
        title: 'title',
      },
      prepare({title}: {title: string}) {
        return {
          title: title,
          media: NodeTree,
        }
      },
    },
  })
}
