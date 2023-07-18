<h1 class="title">Documentation</h1>

[filename](_includes/shields.md ':include')

<p class='large'>Sanity Taxonomy Manager adds a set of tools and two document types to your Sanity Studio &mdash; SKOS Concept and SKOS Concept Scheme &mdash; that you can use to create, organize, and use standards compliant taxonomies.<p>

## Getting Started

### Installation

In your Sanity project folder, run

```bash
npm i sanity-plugin-taxonomy-manager
```

or

```bash
yarn add sanity-plugin-taxonomy-manager
```

### Configuration

Add `taxonomyManager()` to the plugins array of your [project configuration](https://www.sanity.io/docs/configuration#51515480034b). this will make the Taxonomy Manager Tool available in your studio workspace.

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

The plugin adds `skosConcept` and `skosConceptScheme` document types to your studio. If you display all documents by default, you can use a filter on `documentTypeListItems` in the [desk tool configuration](https://www.sanity.io/docs/desk-tool-api) to exclude taxonomy manager document types from your main document view.

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

### Options

The `baseURI` option allows you to set a default URI (Uniform Resource Identifier) for new concepts and concept schemes. Unique identifiers allow for the clear an unambiguous identification of concepts across namespaces, for example between `https://shipparts.com/vocab/Bow` and `https://wrappingsupplies.com/vocab/Bow`. The base URI of these concepts is `https://shipparts.com/vocab/` and `https://wrappingsupplies.com/vocab/`, respectively.

- In most cases, it makes sense for your base URI to be a directory or subdirectory of your website.
- In all cases, the URI you choose should be in a domain that you control.
- The `baseUri` default is optional. If you omit it, the Base URI for new concepts and concept schemes is pre-populated based on the most recently used Base URI value.

## Taxonomy Design
Taxonomies come in a variety of shapes and sizes, ranging from huge hierarchies of thousands of terms, to small trees or lists of a handful of important concepts. While larger taxonomies can take teams of experts years to build, the "[open-world assumption](https://en.wikipedia.org/wiki/Open-world_assumption)" on which standards-based taxonomies are built means that small, purposeful taxonomies of well defined terms can also deliver value and form a solid foundation for future work. 

Whether your taxonomy is large or small, attention to design best practices can help ensure that work performs and scales as intended. Here is a very high level summary of the common steps often involved in taxonomy creation:

1. [Formulate goals](#formulate-goals)
2. [Audit your content](#audit-your-content)
3. [Adopt, adapt, buy, or build](#adopt-adapt-buy-or-build)
4. [Identify & define concepts](#identify--define-concepts)
5. [Create relationships](#create-relationships)
6. [Review, test, and revise](#review-test-and-revise)
7. [Tag content](#tag-content)
8. [Establish Governance](#establish-governance)


### Steps 

1. #### Formulate Goals
Identify what your taxonomy needs to accomplish. I recommend creating or adopting taxonomies *for* a purpose, as opposed to *of* a topic. Cross references, navigation, search support, personalization, or something else entirely: knowing what you need your taxonomy to accomplish will help you understand when you have enough coverage of your subject domain.

    > [!TIP]
    > [Domain modeling](https://www.andyfitzgeraldconsulting.com/writing/domain-modeling/) can help you understand how the concepts in your subject domain relate, and where a taxonomy may help intelligently connect them. 

2. #### Audit Your Content
You have to understand the scope and scale of what you're organizing to know how best to arrange it. Auditing your content give you a qualitative picture of the quality and character of the resources in your collection. If you've never performed an audit, it can feel like a daunting task&mdash;especially if you have a lot of content&mdash;but the exercise provides invaluable perspective: without a clear understanding of what you have, everything else is guesswork. 

3. #### Adopt, Adapt, Buy, or Build
Is there a free taxonomy that you can use or adapt to meet your goals? If so, start there. If not—especially if you don't realistically have the resources in-house—consider buying a published taxonomy if there's on that meets your needs. The research, iteration, and support paid resources provide may be well worth the cost. Build when you need to: for smaller taxonomies, those just beginning to use classification, or very specific domains, this may be the right option. 

    > [!TIP]
    > The [Basic Register of Thesauri, Ontologies & Classifications](https://bartoc.org/about) (BARTOC) lets you search, compare, and access details about thousands of vocabularies in multiple languages, many of them available for free use. It's a great place to start a taxonomy search. 

4. #### Identify & Define Concepts  
Though we commonly think of taxonomies as hierarchies of terms, each of these "terms" is ultimately a label for a concept in your subject domain. Identifying the **concepts** you need to organize can help you focus on what you need to organize before getting mired in the organizational and usability details of what labels those things will have. Candidate concepts can be found in your content audit and other business resources, in your user research, and through discussions with stakeholders. Look for concepts that represent classes of things (as opposed to individual instances), and which have significance in your content, to your users, and to your organization.  

    Once you've identified concepts, give them a preferred label and a brief definition based on the evidence you've collected. Clear definitions help ensure that when you test and vet terms and relationships with stakeholders and subject matter experts you're all talking about the same idea. 

    > [!TIP]
    > Evidence for taxonomy term definitions and relationships is called "warrant" in the literature. See [ANSI/NISO Z39-19-2005 (2010)](https://groups.niso.org/higherlogic/ws/public/download/12591/z39-19-2005r2010.pdf) "5.3.5 Using Warrant to Select Terms" for a concise overview. 

5. #### Create Relationships  
Once you have enumerated and defined the concepts your taxonomy needs to organize, it's time to create relationships between then. Hierarchies based on parent-child "Broader Concept" relationships are perhaps the most common, and will likely be the primary kinds of connections you make in Type<!-- TODO: Link to Type example, once created --> and Topic <!-- TODO: Link to Topic example, once created -->taxonomies. 

    ![Sanity taxonomy manager view showing highlighted plus sign inside of a circle icon next to a top term, and a tool tip with the text, "Add a child concept"](_images/add-child.png)

    Faceted<!-- TODO: Link to Type example, once created --> taxonomies also commonly use a shallow set of parent concepts (the facets) with allowed facet values as their children.

    Don't assume, however, that your taxonomy will necessarily be a tree. Create relationships based on the goals you established in step one. A set of well defined and controlled terms in a simple flat list can be incredibly useful in some contexts. "Related Concept" relationships are also a powerful way to create nuanced relationships between terms in order to achieve well defined outcomes. 

    > [!NOTE]
    > Concepts cannot be related by both "Broader" and "Related" relationships. This is to help avoid the inference of unintended relationships between concepts at different levels of the hierarchy. See [SKOS Primer: 2.3.2 Associative Relationships](https://www.w3.org/TR/skos-primer/#secassociative) for details. 

6. #### Review, Test, and Revise  
Ideally, you should plan to review goals, audits, concepts, and relationships with stakeholders and subject matter experts as you go. At the very least, it is important to review your draft taxonomy with them to make sure you haven't missed anything from their point of view, and to ensure that your vision of the domain aligns with theirs. 

    It is also important to test your draft taxonomy with future users: both those who will tag content, and those who will use the taxonomy to find content by browsing or search. Which tests to perform will depend on how your taxonomy will be used and what outcomes it is intended to achieve. Card sorting (usually closed sorting at this phase), tree testing, A/B testing, and prototype usability testing are all testing methods to consider. Be sure to do this early enough in your project that you leave time to revise based on what you learn and integrate changes. 

7. #### Tag Content  
Depending on the volume of content you need to tag, you may opt for automated or manual approaches. Natural language processing (NLP) tools&mdash;and yes, generative AI&mdash;can be used to automate the tagging process. Even the best of tools are not error free, so it is important for a human with background on the project and the taxonomy to review tags prior to unleashing them on your users. 

    Manual tagging can be a good option if you have a small content collection, an army of interns, or are tagging new content as you go. Don't assume that your taggers or writers will intuitively know how to correctly tag content in a way that achieves the goals you've envisioned. Training should include background on what the purposes the taxonomy serves, an orientation to the structure of the taxonomy and concept definitions, and practice applying tags to different types of content.  

8. #### Establish Governance  
Taxonomies are never finished. Rather, they are living systems that grow and evolve with the business. The goal of governance is to create a repeatable, accountable, visible, and predictable process for managing taxonomy changes. 

    Successful taxonomy governance establishes long-term ownership and responsibility for taxonomies, responds to feedback from taxonomy users, and assures the sustainable evolution of taxonomies in response to changes in user and system needs. Governance activities include periodic review of taxonomy performance and responding to suggestions, requests, and problems raised by taxonomy users. 

### Resources
As you might imagine, there is much more to creating, using, and managing taxonomies than is covered in this brief guide. Here are a few resources I've found particularly insightful to help you expand on what is presented here:

#### Articles
- Grace Lau's [six part taxonomy series](https://boxesandarrows.com/building-the-business-case-for-taxonomy/), Boxes and Arrows
- "[Taxonomy 101: Definition, Best Practices, and How It Complements Other IA Work](https://www.nngroup.com/articles/taxonomy-101/)" by Page Laubheimer, Nielsen Norman Group
- Heather Hedden's [taxonomy articles](https://www.hedden-information.com/category/taxonomy-creation/) on the Accidental Taxonomist Blog 
- [An Introduction to Taxonomies](https://uxbooth.com/articles/introduction-to-taxonomies/) by Sarah Khan, UX Booth

#### Standards & Recommendations
- [ANSI/NISO Z39.19-2005 (R2010): Guidelines for the Construction, Format, and Management of Monolingual Controlled Vocabularies](https://groups.niso.org/higherlogic/ws/public/download/12591/z39-19-2005r2010.pdf)
- [Semantic Interoperability Centre Europe: Guidelines and Good Practices for Taxonomies](https://joinup.ec.europa.eu/sites/default/files/document/2011-12/guidelines-and-good-practices-for-taxonomies-v1.3a.pdf)

#### Books
- [The Accidental Taxonomist](https://www.amazon.com/Accidental-Taxonomist-Third-Heather-Hedden/dp/1573875864), Heather Hedden, Information Today  
An approachable, practical, and thorough introduction to taxonomy design, use, and management by a highly knowledgeable expert in the field. Now in its third edition (2022).

- [The Discipline of Organizing](https://mitpress.mit.edu/9780262518505/the-discipline-of-organizing/), ed. Robert Glushko, MIT Press  
A broad and wide ranging reference for the principles and activities common across information organizing systems.

- [Building Ontologies with Basic Formal Ontology](https://mitpress.mit.edu/9780262527811/building-ontologies-with-basic-formal-ontology/), Robert Arp, Barry Smith & Andrew D. Spear, MIT Press  
Though this text focuses on using the top level "Basic Formal Ontology" (BFO) to create application-specific domain ontologies, along the way the authors give excellent rationale, examples, and illustrations of term selection, definition, and relationships that apply to both ontology and taxonomy creation.

- [The Intellectual Foundation of Information Organization](https://mitpress.mit.edu/9780262512619/the-intellectual-foundation-of-information-organization/), Elaine Svenonius, MIT Press  
If your inner four year old can't stop asking _why_ the best practices recommended in the rest of the literature are the way they are, Svenonious presents here a systematic tour of the cataloging, indexing, and classification foundations that digital information organization and retrieval. 


## Building Taxonomies

### Creating Concept Schemes

[SKOS Concept Schemes](https://www.w3.org/TR/skos-reference/#schemes) allow you to group individual concepts (sometimes referred to as terms) together as individual taxonomies, thesauri, or classification schemes. While concepts can be created and used as standalone entities, concept schemes offer a convenient way to namespace and describe terms and relationships designed for specific purposes. 

![adding a concept scheme animation](_images/addConceptScheme.gif)

When you add a new concept scheme, Taxonomy Manager will prompt to you add a name and description, and will then prompt you to start adding concepts. If you have not set a default `baseUri`, the scheme will be created with the most recently used base URI. If you have not yet created any other concepts or schemes, you will need to enter a base URI in the editor tab before you can publish the scheme. 

### Adding Concepts

You can create SKOS Concepts via Sanity Studio's New Document buttons, or from within a SKOS Concept Scheme. Creating concepts within a scheme automatically adds concepts to the scheme in question, and creates hierarchical relationships between terms based on where in the tree view they are added.  

- **Top Concepts** are, by convention, used to signify the topmost concepts in the hierarchical relations for that scheme. Top Concepts can be used to denote the broadest categories in a hierarchy, or to describe facets in a faceted taxonomy.  
![adding a top concept to a scheme animation](_images/addTopConcept.gif)

- **Concepts** are the fundamental elements of a SKOS vocabulary. Concepts are the ideas, meanings, or (categories of) objects and events which underlie your knowledge organization systems. Concepts are distinct from the labels used to refer to them. This distinction is important because it is what allows you to change and iterate the details of labels based on performance or user expectations, and to localize concepts with labels in different languages without changing the meaning or semantics of your scheme.  
![adding a child concept to a scheme animation](_images/addChildConcept.gif)

All fields _except_ Preferred Label and Base IRI are optional, and are to be used as best fits the needs of your information modeling task. All Concept fields map to elements of the machine readable data model described in the [W3C SKOS Recommendation](https://www.w3.org/TR/skos-reference/).

## Adding Schemes to Documents
Taxonomy Manager includes two Reference Filter helpers to help you include whole taxonomies or individual taxonomy branches in your document schemas. The filters use the automatically generated concept/scheme ID that is appended to your base URI to create the concept/scheme RDF identifier:

![Locating the concept/scheme id](_images/conceptId.png)

### Scheme Filter
To allow a `reference` field to access any term in a SKOS Concept Scheme, use the `schemeFilter` helper. The `schemeFilter` helper takes one parameter: the RDF URI ID from the Concept Scheme you want to use, located just below the `Base URI` field. Copy the identifier that follows your Base URI and use it as the value for `schemeId` in the `schemeFilter` settings object: 

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

### Branch Filter
To limit a `reference` field to a particular branch in a SKOS Concept Scheme, use the `branchFilter` helper. The `branchFilter` helper takes two parameters: the RDF URI ID from the Concept Scheme you want to use and the Concept ID in that Scheme to whose children your field is limited. The Concept ID can be a Top Concept, or any other concept (with children) in your scheme:

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
