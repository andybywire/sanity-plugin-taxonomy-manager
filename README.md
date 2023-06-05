# Sanity Taxonomy Manager Plugin

![NPM Version](https://img.shields.io/npm/v/sanity-plugin-taxonomy-manager?style=flat-square)
![License](https://img.shields.io/npm/l/sanity-plugin-taxonomy-manager?style=flat-square)

<!-- ### Create and manage [SKOS](https://www.w3.org/TR/skos-primer/) compliant taxonomies, thesauri, and classification schemes in Sanity Studio. -->

> This is a **Sanity Studio v3** plugin.
> For the v2 version, please refer to the [v2-branch](https://github.com/andybywire/sanity-plugin-taxonomy-manager/tree/studio-v2).

Taxonomies are crucial tools for organization and interoperability between and across data sets. Taxonomy Manager provides a way for content authors to create, use, and maintain standards compliant taxonomies in Sanity Studio.

The Taxonomy Manager document schema is based on the [World Wide Web Consortium](https://www.w3.org/) (W3C) [Simple Knowledge Organization Scheme](https://www.w3.org/TR/skos-reference/) (SKOS) recommendation. Concept and concept scheme editor tools include standard SKOS properties, hints for creating consistent concepts and vocabularies, and validation functions for preventing consistency errors.

<img src="https://user-images.githubusercontent.com/3710835/212743871-14760a60-0689-4cc3-a13e-55dd7a4ef19a.png" width="700">

## Features

- Adds two document types to your Sanity schema which are used to generate SKOS compliant concepts and concept schemes: `skosConcept` and `skosConceptScheme`
- Pre-populates [base URI](https://www.w3.org/TR/skos-primer/#secconcept) values for new concepts based on the most recently used base URI
- Validates [disjunction between Broader and Related relationships](https://www.w3.org/TR/skos-reference/#L2422)
- Validates [disjunction between Preferred and Alternate/Hidden labels](https://www.w3.org/TR/skos-reference/#L1567)

## Installation

Install using the [Sanity CLI](https://www.sanity.io/docs/cli).

```bash
$ npm i sanity-plugin-taxonomy-manager
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
1. Tag resources with concepts and then integrate into search indexing, filtering, navigation, and semantic web services.

### Semantic Relationships

The concept editor includes filtering and validation to help you create consistent SKOS vocabularies:

**SKOS Broader and Related Concepts**  
Adding the same concept to Broader and Related fields is not allowed, and the editor validates disjunction of Related concepts with Broader Transitive up to five hierarchical levels in either direction.

**Preferred, Alternative, and Hidden Labels**  
Preferred Labels are validated for uniqueness across concepts, and Preferred, Alternative, and Hidden are validated to prevent duplicates and overlap.

**Scope Notes, Definition, and Examples**  
Standard optional SKOS documentation fields are included by default.

**Support for Single or Multiple Taxonomy Schemes (or none)**  
For cases where more than one taxonomy is needed, multiple [SKOS Concept Schemes](https://www.w3.org/TR/skos-reference/#schemes) are supported. Schemes can be used to configure filtered views of concepts in Sanity Structure Builder and can be used to scope values for reference arrays.

  <!-- Concept Scheme views show a hierarchical list (Tree View) of the concepts included in a given scheme. This list allows for easy visualization of Top Concepts, polyhierarchy (concepts that appear in more than one place in the hierarchy), and "Orphan" terms (top level concepts not denoted as a "Top Concept"). -->

## SKOS Overview

> The [Simple Knowledge Organization System (SKOS)](https://www.w3.org/TR/skos-reference/) is a common data model for sharing and linking knowledge organization systems via the Web.
>
> Many knowledge organization systems, such as thesauri, taxonomies, classification schemes and subject heading systems, share a similar structure, and are used in similar applications. SKOS captures much of this similarity and makes it explicit, to enable data and technology sharing across diverse applications.
>
> The SKOS data model provides a standard, low-cost migration path for porting existing knowledge organization systems to the Semantic Web. SKOS also provides a lightweight, intuitive language for developing and sharing new knowledge organization systems. It may be used on its own, or in combination with formal knowledge representation languages such as the Web Ontology language (OWL).

## License

MIT © Andy Fitzgerald
See LICENSE
