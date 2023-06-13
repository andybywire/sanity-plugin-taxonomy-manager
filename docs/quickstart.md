# Quick start

## Installation

In your Sanity project folder, run

```bash
npm i sanity-plugin-taxonomy-manager
```

or

```bash
yarn add sanity-plugin-taxonomy-manager
```

## Configuration

Add the plugin to your project configuration to make the `skosConcept` and `skosConceptScheme` document types available in your studio.

```js
// sanity.config.js

import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {structure} from './deskStructure'
import {taxonomyManager} from 'sanity-plugin-taxonomy-manager'
import {schemaTypes} from './schemas'

export default defineConfig({
  name: 'default',
  title: 'Sanity Studio',
  projectId: 'project-id',
  dataset: 'production',
  plugins: [
    deskTool({
      structure,
    }),
    // Include the taxonomy manager plugin
    taxonomyManager({
      // Optional: Set a Base URI to use when
      // creating new concepts & schemes
      baseUri: 'https://example.com/',
    }),
  ],
  schema: {
    types: schemaTypes,
  },
})
```

The `baseURI` option allows you to set a default URI (Uniform Resource Identifier) for new concepts and concept schemes. Unique identifiers allow for the clear an unambiguous identification of concepts across namespaces, for example between `https://shipparts.com/vocab#Bow` and `https://wrappingsupplies.com/vocab#Bow`. The base URI of these concepts is `https://shipparts.com/` and `https://wrappingsupplies.com/`, respectively.

- In most cases, it makes sense for your base URI to be the root or a subdirectory of your website.
- In all cases, the URI you choose should be in a domain that you control.
- The `baseUri` default is optional. If you omit it, the Base URI for new concepts and concept schemes is pre-populated based on the most recently used Base URI value.

Use [Structure Builder](https://www.sanity.io/docs/structure-builder-reference) to create a separate area for your taxonomy tools and add the provided Concept Scheme Tree View component.

```js
// ./deskStructure.js
import {TreeView} from 'sanity-plugin-taxonomy-manager'

export const structure = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Concept Schemes')
        .schemaType('skosConceptScheme')
        .child(
          S.documentTypeList('skosConceptScheme')
            .title('Concept Schemes')
            .child((id) =>
              S.document()
                .schemaType('skosConceptScheme')
                .documentId(id)
                .views([S.view.component(TreeView).title('Tree View'), S.view.form()])
            )
        ),
      S.documentTypeListItem('skosConcept').title('Concepts'),
      S.divider(),

      // Remove Taxonomy Manager types from the default document type list
      ...S.documentTypeListItems().filter(
        (listItem) => !['skosConcept', 'skosConceptScheme'].includes(listItem.getId())
      ),
    ])
```

## Usage

1. Create a [Concept Scheme](https://www.w3.org/TR/skos-reference/#schemes) to group related concepts
1. Create and describe Concepts.
   - All fields _except_ Preferred Label and Base IRI are optional, and are to be used as best fits the needs of your information modeling task.
     - Preferred Label is the preferred lexical label for a resource in a given language. In the current version of Taxonomy Manager, the Preferred Label is automatically used as the final segment for a concept's unique identifier (its URI).
     - Base IRI is the root IRI (Internationalized Resource Identifier) used to create unique concept identifiers. Unique identifiers allow for the clear an unambiguous identification of concepts across namespaces, for example between `https://shipparts.com/vocab#Bow` and `https://wrappingsupplies.com/vocab#Bow`. The base URI of these concepts is `https://shipparts.com/` and `https://wrappingsupplies.com/`, respectively. For a wider introduction to concept identifiers, see [Cool URIs for the Semantic Web](https://www.w3.org/TR/cooluris/).
   - Concepts may optionally be added to a Concept Scheme as Top Concepts, to represent the broadest concepts of a particular hierarchy and provide efficient access points to broader/narrower concept hierarchies
   - All Concept fields map to elements of the machine readable data model described in the [W3C SKOS Recommendation](https://www.w3.org/TR/skos-reference/).
1. Use Reference Filter helpers to easily include whole taxonomies or individual taxonomy branches in your document schemas:

   - To allow a `reference` field to access any term in a SKOS Concept Scheme, use the `schemeFilter` helper. The `schemeFilter` helper takes one parameter: the RDF URI ID from the Concept Scheme you want to use, located just below the `Base URI` field. Copy the identifier that follows your Base URI:

     ```js
     import {schemeFilter} from 'sanity-plugin-taxonomy-manager'

     ...

     defineField({
         name: 'gradeLevel',
         title: 'Grade Level',
         type: 'reference',
         to: {type: 'skosConcept'},
         options: {
           filter: () => schemeFilter({schemeId: 'f3deba'}),
           disableNew: true,
         },
       }),
     ```

   - To limit a `reference` field to a particular branch in a SKOS Concept Scheme, use the `branchFilter` helper. The `branchFilter` helper takes two parameter: the RDF URI ID from the Concept Scheme you want to use and the Concept ID in that Scheme to whose children your field is limited:

     ```js
     import {branchFilter} from 'sanity-plugin-taxonomy-manager'

     ...

     defineField({
         name: 'subject',
         title: 'Subject',
         type: 'reference',
         to: {type: 'skosConcept'},
         options: {
           filter: () => branchFilter({schemeId: 'f3deba', branchId: '25f826'}),
           disableNew: true,
         },
       }),
     ```

1. Tag resources with concepts and then integrate into search indexing, filtering, navigation, and semantic web services.