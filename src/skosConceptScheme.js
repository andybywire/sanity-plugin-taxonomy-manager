/**
 * Sanity document scheme for SKOS Concept Schemes
 * @todo Afford setting a "default" scheme which is used as an initial value for new concepts. When no default is set, concepts are created without any scheme.
 * @todo Add administrative metadata: author, date, last revised, etc.
 * @todo Consider adding informational lists to this view (via custom input component): number of terms, list of terms, links. Perhaps eventually a navigable tree view.
 */
import {RiNodeTree} from 'react-icons/ri'
import TreeView from './components/treeView'

export default {
  name: 'skosConceptScheme',
  title: 'Taxonomy Schemes',
  type: 'document',
  icon: RiNodeTree,
  fields: [
    {
      name: 'title',
      title: 'Taxonomy Concept Scheme',
      type: 'string',
      description:
        'Concept schemes are used to group concepts into defined sets, such as thesauri, classification schemes, or facets. Concepts may belong on many (or no) concept schemes, and you may create as many (or few) concept schemes as you like.',
    },
    {
      name: 'treeView',
      title: 'Concept Scheme Tree View',
      type: 'string',
      description: 
        'Concept hierarchy is determined by \'Broader Than\' and \'Top Concept\' relationships assigned to each concept. A holistic view of these relationships is shown below. Top Concepts are indicated in bold. Italicized concepts represent polyhierarchy (concepts that appear in more than one branch of the hierarchy tree.)',
      inputComponent: TreeView
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description: 'Describe the intended use of this scheme.',
    },
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
}
