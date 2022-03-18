# Sanity Plugin Taxonomy Manager

### WARNING: This plugin is still in development. Please do not use it in production until this warning is removed.

Create and manage [SKOS](https://www.w3.org/TR/skos-primer/) compliant taxonomies, thesauri, and classification schemes in Sanity Studio.

![sanity-taxonomy-manager-poc-demo](https://user-images.githubusercontent.com/3710835/158623598-04a473b4-a720-4c37-adca-6d39cd0c688c.gif)

## Features

- Adds 3 document types to your schema which are used to generate SKOS compliant concepts and concept schemes: `skosConcept`, `skosConceptScheme`, and `skosTaxonomySettings`
- Pre-populates [base URI](https://www.w3.org/TR/skos-primer/#secconcept) and [concept scheme](https://www.w3.org/TR/skos-primer/#secscheme) values for new concepts
- Validates [disjunction between Broader and Related relationships](https://www.w3.org/TR/skos-reference/#L2422)
- Validates [disjunction between Preferred and Alternate/Hidden labels](https://www.w3.org/TR/skos-reference/#L1567)

## Installation

Install using the [Sanity CLI](https://www.sanity.io/docs/cli).

```bash
$ sanity install taxonomy-manager
```

## Usage

1. Create the Taxonomy Settings doc and set your taxonomy bases IRI. 
2. Create a [Concept Scheme](https://www.w3.org/TR/skos-reference/#schemes) (optional)/
3. Create and describe Concepts. All fields *except* PrefLabel are optional, and are to be used as best fits the needs of your information modeling task. All Concept fields map to elements of the machine readable data model described in the [W3C SKOS Recommendation](https://www.w3.org/TR/skos-reference/). 

## Configuration

You can use [Structure Builder](https://www.sanity.io/docs/structure-builder-reference) to create a separate area for your taxonomy tools.

```js
import {RiNodeTree} from 'react-icons/ri'
import {AiFillTags,AiOutlineTags} from 'react-icons/ai'

const hiddenDocTypes = (listItem) =>
!['skosTaxonomySettings', 'skosConcept', 'skosConceptScheme'].includes(
  listItem.getId()
)
// ... other structure builder items
S.divider(),
S.listItem()
  .title('Concepts')
  .icon(AiFillTags)
  .child(
    S.documentList()
      .title('Concepts')
      .filter('_type == "skosConcept"')
  ),
S.listItem()
.title('Taxonomy Schemes')
.icon(RiNodeTree)
.child(
  S.documentList()
    .title('Taxonomy Schemes')
    .filter('_type == "skosConceptScheme"')
),
S.listItem()
.title('Taxonomy Settings')
.icon(RiSettings4Line)
.child(
  S.document()
  .schemaType('skosTaxonomySettings')
  .documentId('skosTaxonomySettings')
  ),
  S.divider(),
// ... other structure builder items
```

## [SKOS Overview](https://www.w3.org/TR/skos-reference/)

> The Simple Knowledge Organization System (SKOS) is a common data model for sharing and linking knowledge organization systems via the Web.
>
>Many knowledge organization systems, such as thesauri, taxonomies, classification schemes and subject heading systems, share a similar structure, and are used in similar applications. SKOS captures much of this similarity and makes it explicit, to enable data and technology sharing across diverse applications.
>
>The SKOS data model provides a standard, low-cost migration path for porting existing knowledge organization systems to the Semantic Web. SKOS also provides a lightweight, intuitive language for developing and sharing new knowledge organization systems. It may be used on its own, or in combination with formal knowledge representation languages such as the Web Ontology language (OWL).

## License

MIT © Andy Fitzgerald
See LICENSE