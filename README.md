# Sanity Taxonomy Manager


![NPM Version](https://img.shields.io/npm/v/sanity-plugin-taxonomy-manager?style=flat-square)
![License](https://img.shields.io/npm/l/sanity-plugin-taxonomy-manager?style=flat-square)

### Create and manage SKOS compliant taxonomies, thesauri, and classification schemes in Sanity Studio.

<!-- Taxonomies are crucial tools for organization and interoperability between and across data sets. Taxonomy Manager provides a way for content authors to create, use, and maintain standards compliant taxonomies in Sanity Studio.

The Taxonomy Manager document schema is based on the [World Wide Web Consortium](https://www.w3.org/) (W3C) [Simple Knowledge Organization Scheme](https://www.w3.org/TR/skos-reference/) (SKOS) recommendation. Concept and concept scheme editor tools include standard SKOS properties, hints for creating consistent concepts and vocabularies, and validation functions for preventing consistency errors. -->

<img src="https://user-images.githubusercontent.com/3710835/212743871-14760a60-0689-4cc3-a13e-55dd7a4ef19a.png" width="700">

## Documentation

For full documentation, visit [sanitytaxonomymanager.com](https://sanitytaxonomymanager.com).

## Features
<!-- make this more concise -->
- Adds two document types to your Sanity schema which are used to generate [SKOS](https://www.w3.org/TR/skos-primer/) compliant concepts and taxonomies: `skosConcept` and `skosConceptScheme`
- Includes reference filter helpers to allow you to easily include a specific taxonomy, or particular branch of a taxonomy in your Sanity documents
- Encourages taxonomy and thesaurus design best practices by enforcing [disjunction between Broader and Related relationships](https://www.w3.org/TR/skos-reference/#L2422) and [disjunction between Preferred and Alternate/Hidden labels](https://www.w3.org/TR/skos-reference/#L1567)
- Standards compliant architecture means that taxonomy terms and structures can be migrated to standards compliant standalone tools when you need higher level taxonomy and knowledge graph support. 


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

Add the plugin to your [project configuration](https://www.sanity.io/docs/configuration#51515480034b) to add the Taxonomy Manager Tool to your studio workspace.

```js
// sanity.config.js

import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {taxonomyManager} from 'sanity-plugin-taxonomy-manager'
import {schemaTypes} from './schemas'

export default defineConfig({
  name: 'default',
  title: 'Sanity Studio',
  projectId: '<projectId>',
  dataset: 'production',
  plugins: [
    deskTool(),
    // Include the taxonomy manager plugin
    taxonomyManager({
      // Optional: Set a Base URI to use for new concepts & concept schemes
      baseUri: 'https://example.com/',
    }),
  ],
  schema: {
    types: schemaTypes,
  },
})
```

The plugin adds `skosConcept` and `skosConceptScheme` document types to your studio. Use a filter on `documentTypeListItems` in the [desk tool configuration](https://www.sanity.io/docs/desk-tool-api) to exclude taxonomy manager document types from your main document view.

```js
// sanity.config.js

import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {taxonomyManager} from 'sanity-plugin-taxonomy-manager'
import {schemaTypes} from './schemas'

export default defineConfig({
  name: 'default',
  title: 'Sanity Studio',
  projectId: '<projectId>',
  dataset: 'production',
  plugins: [
    deskTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            ...S.documentTypeListItems().filter(
              (listItem) => !['skosConcept', 'skosConceptScheme'].includes(listItem.getId())
            ),
          ]),
    }),
    taxonomyManager({
      baseUri: 'https://example.com/',
    }),
  ],
  schema: {
    types: schemaTypes,
  },
})
```

<!-- ## Usage

1. Create a [Concept Scheme](https://www.w3.org/TR/skos-reference/#schemes) to group related concepts
1. Create and describe Concepts.
   - All fields _except_ Preferred Label and Base IRI are optional, and are to be used as best fits the needs of your information modeling task.
     - Preferred Label is the preferred lexical label for a resource in a given language. In the current version of Taxonomy Manager, the Preferred Label is automatically used as the final segment for a concept's unique identifier (its URI).
     - Base IRI is the root IRI (Internationalized Resource Identifier) used to create unique concept identifiers. Unique identifiers allow for the clear an unambiguous identification of concepts across namespaces, for example between `https://shipparts.com/vocab#Bow` and `https://wrappingsupplies.com/vocab#Bow`. The base URI of these concepts is `https://shipparts.com/` and `https://wrappingsupplies.com/`, respectively. For a wider introduction to concept identifiers, see [Cool URIs for the Semantic Web](https://www.w3.org/TR/cooluris/).
   - Concepts may optionally be added to a Concept Scheme as Top Concepts, to represent the broadest concepts of a particular hierarchy and provide efficient access points to broader/narrower concept hierarchies
   - All Concept fields map to elements of the machine readable data model described in the [W3C SKOS Recommendation](https://www.w3.org/TR/skos-reference/).
1. Use Reference Filter helpers to easily include whole taxonomies or individual taxonomy branches in your document schemas:

   - To allow a `reference` field to access any term in a SKOS Concept Scheme, use the `schemeFilter` helper. The `schemeFilter` helper takes one parameter: the RDF URI ID from the Concept Scheme you want to use, located just below the `Base URI` field. Copy the identifier that follows your Base URI:

     ```
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

     ```
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

1. Tag resources with concepts and then integrate into search indexing, filtering, navigation, and semantic web services. -->


## Contributing
Community collaboration is highly encouraged. To make sure your contributions are aligned with project goals and principles, please read the [contributing docs]() before submitting a pull request. 

## License

MIT © Andy Fitzgerald
See LICENSE
