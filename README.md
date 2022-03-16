# Sanity Taxonomy Manager

Create and manage SKOS compliant taxonomies, thesauri, and classification schemes in Sanity Studio.

**This is a very early first version and still under development! If you stumble on this, please do offer feedback, comments, or pull requests ... but I don't advise anyone to install this yet.**

![sanity-taxonomy-manager-poc-demo](https://user-images.githubusercontent.com/3710835/158623598-04a473b4-a720-4c37-adca-6d39cd0c688c.gif)

<!-- ## Installation

```
sanity install taxonomy-manager
``` -->

<!-- ## Configuration
Use Structure Builder to create a separate area for your taxonomy tools:

```
const hiddenDocTypes = (listItem) =>
!['skosTaxonomySettings', 'skosConcept', 'skosConceptScheme'].includes(
  listItem.getId()
)

...
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
  ...
``` -->


<!-- ## Configuration

The plugin can be configured through `<your-studio-folder>/config/taxonomy-manager.json`:

```json
{
  "add-config": "here"
}
``` -->

## License

MIT © Andy Fitzgerald
See LICENSE