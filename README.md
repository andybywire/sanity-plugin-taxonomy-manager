# Sanity Plugin Taxonomy Manager

#### WARNING: This plugin is still in development. Please do not use it in production until this warning is removed.

Create and manage [SKOS](https://www.w3.org/TR/skos-primer/) compliant taxonomies, thesauri, and classification schemes in Sanity Studio.


#### SKOS Broader and Related Concepts
<img src="https://user-images.githubusercontent.com/3710835/159759995-180cbbf0-e348-4673-90af-f32062924216.png" width="700">

#### Preferred, Alternative, and Hidden Labels
<img src="https://user-images.githubusercontent.com/3710835/159759929-cd0ff6a7-31d5-47f0-bcc7-429d05922866.png" width="700">

#### Scope Notes, Definition, and Examples
<img src="https://user-images.githubusercontent.com/3710835/159759952-50097112-2d80-43d3-ba50-545956e3b2ea.png" width="700">

#### Support for Single or Multiple Taxonomy Schemes (or none)
<img src="https://user-images.githubusercontent.com/3710835/159759972-b29b42ee-42f9-4616-a560-7b7c8802faa5.png" width="700">

<!-- Need to update image/gif:
![sanity-taxonomy-manager-poc-demo](https://user-images.githubusercontent.com/3710835/158623598-04a473b4-a720-4c37-adca-6d39cd0c688c.gif) -->

## Features

- Adds two document types to your Sanity schema which are used to generate SKOS compliant concepts and concept schemes: `skosConcept` and `skosConceptScheme`
- Pre-populates [base URI](https://www.w3.org/TR/skos-primer/#secconcept) and [concept scheme](https://www.w3.org/TR/skos-primer/#secscheme) values for new concepts
- Validates [disjunction between Broader and Related relationships](https://www.w3.org/TR/skos-reference/#L2422)
- Validates [disjunction between Preferred and Alternate/Hidden labels](https://www.w3.org/TR/skos-reference/#L1567)

## Installation

Install using the [Sanity CLI](https://www.sanity.io/docs/cli).

#### NOTE: This plugin is still in development. Please do not use it in production until this warning is removed.

```bash
$ sanity install taxonomy-manager
```
## Configuration

Configure your [concept namespace](https://www.w3.org/TR/skos-primer/#secconcept) in `<your-studio-folder>/config/taxonomy-manager.json`:

```json
{
  "namespace": "http://example.com/"
}
```

This namespace defines the base URI for your concepts and concept schemes. The W3C recommends the use of HTTP URIs when minting concept URIs since they are resolvable to representations that can be accessed using standard Web technologies. For more information about URIs on the Semantic Web, see [Cool URIs for the Semantic Web](https://www.w3.org/TR/2008/NOTE-cooluris-20081203/) and [Best Practice Recipes for Publishing RDF Vocabularies](https://www.w3.org/TR/2008/NOTE-swbp-vocab-pub-20080828/).

You can use [Structure Builder](https://www.sanity.io/docs/structure-builder-reference) to create a separate area for your taxonomy tools.

```js
const hiddenDocTypes = (listItem) =>
!['skosConcept', 'skosConceptScheme'].includes(
  listItem.getId()
)

export default () =>
  // ... other structure builder items
  S.divider(),
  S.documentTypeListItem("skosConcept").title("Concepts"),
  S.documentTypeListItem("skosConceptScheme").title("Taxonomy Schemes"),
  S.divider(),
  // ... other structure builder items
``` 

## Usage

1. Set your taxonomy bases IRI in the `namespace` field of the configuration file. 
2. Create a [Concept Scheme](https://www.w3.org/TR/skos-reference/#schemes) to group related concepts (optional)
3. Create and describe Concepts.
    - All fields _except_ PrefLabel are optional, and are to be used as best fits the needs of your information modeling task.
    - All Concept fields map to elements of the machine readable data model described in the [W3C SKOS Recommendation](https://www.w3.org/TR/skos-reference/).
4. Tag resources with concepts and then integrate into search indexing, navigation, and semantic web services.
    - 👉 Examples to come!

## [SKOS Overview](https://www.w3.org/TR/skos-reference/)

> The Simple Knowledge Organization System (SKOS) is a common data model for sharing and linking knowledge organization systems via the Web.
>
> Many knowledge organization systems, such as thesauri, taxonomies, classification schemes and subject heading systems, share a similar structure, and are used in similar applications. SKOS captures much of this similarity and makes it explicit, to enable data and technology sharing across diverse applications.
>
> The SKOS data model provides a standard, low-cost migration path for porting existing knowledge organization systems to the Semantic Web. SKOS also provides a lightweight, intuitive language for developing and sharing new knowledge organization systems. It may be used on its own, or in combination with formal knowledge representation languages such as the Web Ontology language (OWL).

## To Do

### For Initial Release [1.0.0]

- [x] Move "Settings" data into `config.json`, update initial value fields/functions, and remove "Taxonomy Settings" document scheme
- [ ] Validate [PrefLabel uniqueness](https://www.w3.org/TR/skos-primer/#secpref) across concept collection
- [ ] Validate [Related Concept and Transitive Broader disjunction](https://www.w3.org/TR/skos-reference/#L2422)

### For Subsequent Release

- [ ] Add language and country tags to support internationalization, adjust PrefLabel uniqueness rules
- [ ] Create taxonomy tree view custom input template for `skosConceptScheme`
- [ ] Add implementation examples for single and multiple hierarchical schemes, faceted classification, and thesauri

## License

MIT © Andy Fitzgerald
See LICENSE
