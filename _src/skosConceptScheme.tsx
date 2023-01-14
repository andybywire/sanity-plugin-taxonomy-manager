/**
 * Sanity document scheme for SKOS Concept Schemes
 * @todo Rebuild tree view
 * @todo Afford setting a "default" scheme which is used as an initial value for new concepts. When no default is set, concepts are created without any scheme.
 * @todo Add administrative metadata: author, date, last revised, etc.
 * @todo Consider adding informational lists to this view (via custom input component): number of terms, list of terms, links. Perhaps eventually a navigable tree view.
 */

import {RiNodeTree} from 'react-icons/ri'
import { defineField, defineType } from 'sanity';
import { UriField } from './components/UriField';
import TreeView from './components/TreeView'

export default defineType({
  name: 'skosConceptScheme',
  title: 'Taxonomy Scheme',
  type: 'document',
  icon: RiNodeTree,
  fields: [
    defineField({
      name: 'title',
      title: 'Taxonomy Concept Scheme',
      type: 'string',
      components: {
        input: UriField
      },
      description:  'Schemes group concepts into defined sets, such as thesauri, classification schemes, or facets. Concepts may belong on many (or no) concept schemes, and you may create as many (or few) concept schemes as you like.'
    }),
    defineField(
      {
        name: 'iriBase',
        title: 'Base IRI',
        type: 'url',
        description:
          'The W3C encourages the use of HTTP URIs when minting concept URIs since they are resolvable to representations that can be accessed using standard Web technologies. By default, the last use base IRI is used for new concepts.'
      }
    ),
    defineField({
      name: 'treeView',
      title: 'Concept Scheme Tree View',
      type: 'string',
      description: <>Top Concepts are indicated in <strong>bold</strong>. Concepts in <em>italics</em> represent polyhierarchy (concepts that appear in more than one branch of the hierarchy tree).</>,
      // inputComponent: TreeView
      components: {
        input: TreeView
      }
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Describe the intended use of this scheme.',
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({title}) {
      return {
        title: title,
        media: RiNodeTree,
      }
    },
  },
})
