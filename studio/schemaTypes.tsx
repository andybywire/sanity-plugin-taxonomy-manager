import {defineArrayMember, defineField, defineType} from 'sanity'
import {
  ArrayHierarchyInput,
  branchFilter,
  ReferenceHierarchyInput,
  schemeFilter,
} from 'sanity-plugin-taxonomy-manager'

/**
 * A sample content type for exercising the plugin in the dev studio. It carries
 * real article content — title, short description, and a portable-text body — so
 * the dataset's embeddings have something to match against, plus taxonomy
 * reference fields wired several ways:
 *
 * - `topics` / `primaryTopic` / `browseTopic` exercise the array input, the
 *   branch filter, and browse-only mode. These are field components, so they go
 *   in the `field` slot (the documented registration for the plugin's inputs).
 * - `subject` / `audience` add semantic term recommendations: opening either tree
 *   scores concepts by `text::semanticSimilarity()` against the current `title`
 *   and `shortDescription` values (`body` is portable text, so it can't feed the
 *   string-only `fieldReferences`). Both point at the "Educational Resources"
 *   scheme (`f3deba`) as a placeholder — realign to real vocabularies later.
 *
 * The plugin contributes the skosConcept / skosConceptScheme types itself, so
 * they are not declared here.
 */
const article = defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string'}),
    defineField({name: 'shortDescription', title: 'Short Description', type: 'text', rows: 3}),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [defineArrayMember({type: 'block'})],
    }),
    defineField({
      name: 'subject',
      title: 'Subject — single ref, semantic recommendations',
      type: 'reference',
      to: [{type: 'skosConcept'}],
      options: {filter: schemeFilter({schemeId: 'effc47'})},
      components: {
        field: (props) => (
          <ReferenceHierarchyInput
            {...props}
            semanticSearch={{fieldReferences: ['title', 'shortDescription'], maxResults: 5}}
          />
        ),
      },
    }),
    defineField({
      name: 'audience',
      title: 'Audience — single ref, semantic recommendations',
      type: 'reference',
      to: [{type: 'skosConcept'}],
      options: {filter: schemeFilter({schemeId: 'KWuXFP'})},
      components: {
        field: (props) => (
          <ReferenceHierarchyInput
            {...props}
            semanticSearch={{fieldReferences: ['title', 'shortDescription'], maxResults: 5}}
          />
        ),
      },
    }),
    defineField({
      name: 'topics',
      title: 'Topics — array input, scheme filter',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'skosConcept'}],
          options: {filter: schemeFilter({schemeId: 'f3deba'})},
        }),
      ],
      components: {field: ArrayHierarchyInput},
    }),
    defineField({
      name: 'primaryTopic',
      title: 'Primary topic — single ref input, branch filter',
      type: 'reference',
      to: [{type: 'skosConcept'}],
      options: {filter: branchFilter({schemeId: 'f3deba', branchId: '25f826'})},
      components: {field: ReferenceHierarchyInput},
    }),
    defineField({
      name: 'browseTopic',
      title: 'Browse-only topic — tree without search',
      type: 'reference',
      to: [{type: 'skosConcept'}],
      options: {filter: schemeFilter({schemeId: 'f3deba', browseOnly: true})},
      components: {field: ReferenceHierarchyInput},
    }),
  ],
})

export const schemaTypes = [article]
