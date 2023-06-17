# Sanity Taxonomy Manager Plugin

![NPM Version](https://img.shields.io/npm/v/sanity-plugin-taxonomy-manager?style=flat-square)
![License](https://img.shields.io/npm/l/sanity-plugin-taxonomy-manager?style=flat-square)

<!-- ### Create and manage [SKOS](https://www.w3.org/TR/skos-primer/) compliant taxonomies, thesauri, and classification schemes in Sanity Studio. -->

> This is a **Sanity Studio v3** plugin.
> For the v2 version, please refer to the [v2-branch](https://github.com/andybywire/sanity-plugin-taxonomy-manager/tree/studio-v2).

> 🚨 **Breaking Changes for Concept Fields**
>
> Version 2.3.1 of Sanity Taxonomy Manager is the last version to support the `baseUri` and `skosConceptScheme` fields that were part of version 1 and early (patch) versions of v2. 
>
> If you are upgrading to Taxonomy Manager version 3 with concepts created in one of these early versions, install this version first. v2.3.1 includes field utilities to help you:
>
> - convert `baseUri` to the new schema
> - generate unique `concept` and `conceptScheme` identifiers
> - remove deprecated `skosConceptScheme` references in Concepts
>
> In Sanity Taxonomy Manager 3.0, both these utilities and the fields that support the deprecated schemes will be removed. Concept tags and queries will still work, but may lead to warnings in the Studio about scheme/data mismatches.
>
> Please feel free to reach out on [GitHub Discussions](https://github.com/andybywire/sanity-plugin-taxonomy-manager/discussions) with any questions. 

Taxonomies are crucial tools for organization and interoperability between and across data sets. Taxonomy Manager provides a way for content authors to create, use, and maintain standards compliant taxonomies in Sanity Studio.

The Taxonomy Manager document schema is based on the [World Wide Web Consortium](https://www.w3.org/) (W3C) [Simple Knowledge Organization Scheme](https://www.w3.org/TR/skos-reference/) (SKOS) recommendation. Concept and concept scheme editor tools include standard SKOS properties, hints for creating consistent concepts and vocabularies, and validation functions for preventing consistency errors.

<img src="https://user-images.githubusercontent.com/3710835/212743871-14760a60-0689-4cc3-a13e-55dd7a4ef19a.png" width="700">

## Features

- Adds two document types to your Sanity schema which are used to generate SKOS compliant concepts and concept schemes: `skosConcept` and `skosConceptScheme`
- Pre-populates [base URI](https://www.w3.org/TR/skos-primer/#secconcept) values for new concepts based on the most recently used base URI
- Validates [disjunction between Broader and Related relationships](https://www.w3.org/TR/skos-reference/#L2422)
- Validates [disjunction between Preferred and Alternate/Hidden labels](https://www.w3.org/TR/skos-reference/#L1567)

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

Add the plugin to your project configuration to make the skosConcept and skosConceptScheme document types available in your studio.

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
      baseUri: 'https://example.com/'
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
1. Tag resources with concepts and then integrate into search indexing, filtering, navigation, and semantic web services.

## License

MIT © Andy Fitzgerald
See LICENSE
