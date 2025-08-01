import {EditIcon} from '@sanity/icons'

import NodeTree from './static/NodeTree'
import {TreeView} from './components/TreeView'

/**
 * #### Default Desk Structure for Concept and Concept Scheme
 * Sets defaultDocumentNode. Consider exporting in the future,
 * if there is a use case for mixing taxonomy views in the main
 * desk structure.
 */
export const structure = (S: any) =>
  S.list()
    .title('Taxonomy Manager')
    .items([
      S.documentTypeListItem('skosConceptScheme').title('Concept Schemes'),
      S.documentTypeListItem('skosConcept').title('Concepts'),
    ])

// set default document node here — so that if users want concepts
// and schemes elsewhere in desk, they'll get the right views.
export const defaultDocumentNode = (S: any, {schemaType}: {schemaType: any}) => {
  // Conditionally return a different configuration based on the schema type
  switch (schemaType) {
    case 'skosConceptScheme':
      return S.document().views([
        S.view.component(TreeView).title('Tree View').icon(NodeTree),
        S.view.form().icon(EditIcon),
      ])
    case 'skosConcept':
      return S.document().views([S.view.form().icon(EditIcon)])
    default:
      S.view.form()
  }
}
