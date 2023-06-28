<h1 class="title">Sanity Taxonomy Manager</h1>

[filename](_includes/shields.md ':include')

<p class='large'>Create and manage standards compliant taxonomies, thesauri, and classification schemes in Sanity Studio.<p>

![taxonomy manager plugin screenshot](_images/taxonomyManager.png)

- W3C SKOS Compliant Taxonomies and Thesauri
- Support for hierarchical and faceted taxonomies
- Purpose built for Sanity Studio

Taxonomies are crucial tools for organization and interoperability between and across data sets. Taxonomy Manager provides a way for content authors to create, use, and maintain standards compliant taxonomies in Sanity Studio.

The Taxonomy Manager document schema is based on the [World Wide Web Consortium](https://www.w3.org/) (W3C) [Simple Knowledge Organization Scheme](https://www.w3.org/TR/skos-reference/) (SKOS) recommendation. Concept and concept scheme editor tools include standard SKOS properties, hints for creating consistent concepts and vocabularies, and validation functions for preventing consistency errors.

## Features

- Adds two document types to your Sanity schema which are used to generate SKOS compliant concepts and concept schemes: `skosConcept` and `skosConceptScheme`
- Pre-populates [base URI](https://www.w3.org/TR/skos-primer/#secconcept) values for new concepts based on the most recently used base URI
- Validates [disjunction between Broader and Related relationships](https://www.w3.org/TR/skos-reference/#L2422)
- Validates [disjunction between Preferred and Alternate/Hidden labels](https://www.w3.org/TR/skos-reference/#L1567)

## Semantic Relationships

The concept editor includes filtering and validation to help you create consistent SKOS vocabularies:

**SKOS Broader and Related Concepts**  
Adding the same concept to Broader and Related fields is not allowed, and the editor validates disjunction of Related concepts with Broader Transitive up to five hierarchical levels in either direction.

**Preferred, Alternative, and Hidden Labels**  
Preferred Labels are validated for uniqueness across concepts, and Preferred, Alternative, and Hidden are validated to prevent duplicates and overlap.

**Scope Notes, Definition, and Examples**  
Standard optional SKOS documentation fields are included by default.

**Support for Single or Multiple Taxonomy Schemes (or none)**  
For cases where more than one taxonomy is needed, multiple [SKOS Concept Schemes](https://www.w3.org/TR/skos-reference/#schemes) are supported. Schemes can be used to configure filtered views of concepts in Sanity Structure Builder and can be used to scope values for reference arrays.

## SKOS Overview

> The [Simple Knowledge Organization System (SKOS)](https://www.w3.org/TR/skos-reference/) is a common data model for sharing and linking knowledge organization systems via the Web.
>
> Many knowledge organization systems, such as thesauri, taxonomies, classification schemes and subject heading systems, share a similar structure, and are used in similar applications. SKOS captures much of this similarity and makes it explicit, to enable data and technology sharing across diverse applications.
>
> The SKOS data model provides a standard, low-cost migration path for porting existing knowledge organization systems to the Semantic Web. SKOS also provides a lightweight, intuitive language for developing and sharing new knowledge organization systems. It may be used on its own, or in combination with formal knowledge representation languages such as the Web Ontology language (OWL).

## License

MIT © Andy Fitzgerald
See [LICENSE](https://github.com/andybywire/sanity-plugin-taxonomy-manager/blob/main/LICENSE)

