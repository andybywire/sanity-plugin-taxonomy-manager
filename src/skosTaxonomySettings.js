/**
 * Global SKOS taxonomy settings
 * @todo BaseIri validation: figure out why the validation warning message shows up twice when there's no value.
 * @todo Deal with Settings values when the Settings doc may not have been created from structure builder (with a 'skosTaxonomySettings' ID)
 * @todo Add IRI pattern selector (or instructions): hash or slash; default to slash
 * @todo Add IRI format selector: PrefLabel or UUID (perhaps from Sanity _id); default to PrefLabel
 * @todo Consider adding an array (or list) here of Concept Schemes. These were originally envisioned as being accessed here, but are in their own top level grouping for now to support editing. They do need to be distinct, addressable entities, so they need to remain documents. 
 */
import {RiSettings4Line} from 'react-icons/ri'

export default {
  name: 'skosTaxonomySettings',
  title: 'Taxonomy Settings',
  type: 'document',
  icon: RiSettings4Line,
  // Once you've created your settings doc, uncomment this line to disable the creation of additional copies:
  // __experimental_actions: [/*'create',*/ 'update', /*'delete',*/ 'publish'],
  fields: [
    {
      name: 'title',
      title: 'Taxonomy Name',
      type: 'string',
      hidden: true,
      initialValue: 'Taxonomy Settings',
    },
    {
      name: 'baseIri',
      title: 'Base IRI',
      type: 'url',
      description:
        'The base IRI (Internationalised Resource Identifier) is used to specify the fully qualified name of taxonomy elements. The W3C encourages the use of HTTP URIs when minting concept URIs since they are resolvable to representations that can be accessed using standard Web technologies. The "base IRI" entered here is used as the default base for new concepts.',
      validation: (Rule) =>
        Rule.required().warning(
          'Entering a Base IRI is highly recommended in order to ensure taxonomy integrity and interoperability.'
        ),
    },
  ],
}
