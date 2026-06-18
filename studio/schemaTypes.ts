import {defineArrayMember, defineField, defineType} from 'sanity'
import {
  ArrayHierarchyInput,
  branchFilter,
  ReferenceHierarchyInput,
  schemeFilter,
} from 'sanity-plugin-taxonomy-manager'

/**
 * A sample content type that tags concepts, exercising the plugin's custom
 * reference/array inputs and the scheme/branch filters against the dev
 * dataset's "Educational Resources" scheme (schemeId `f3deba`, top concept
 * branch `25f826`). The plugin contributes the skosConcept / skosConceptScheme
 * types itself, so they are not declared here.
 */
const article = defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string'}),
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
      components: {input: ArrayHierarchyInput},
    }),
    defineField({
      name: 'primaryTopic',
      title: 'Primary topic — single ref input, branch filter',
      type: 'reference',
      to: [{type: 'skosConcept'}],
      options: {filter: branchFilter({schemeId: 'f3deba', branchId: '25f826'})},
      components: {input: ReferenceHierarchyInput},
    }),
    defineField({
      name: 'browseTopic',
      title: 'Browse-only topic — tree without search',
      type: 'reference',
      to: [{type: 'skosConcept'}],
      options: {filter: schemeFilter({schemeId: 'f3deba', browseOnly: true})},
      components: {input: ReferenceHierarchyInput},
    }),
  ],
})

export const schemaTypes = [article]
