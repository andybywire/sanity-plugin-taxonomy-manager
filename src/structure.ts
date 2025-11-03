import {EditIcon, DocumentsIcon} from '@sanity/icons'
import type {StructureBuilder, ListBuilder, DefaultDocumentNodeResolver} from 'sanity/structure'

import {TreeView} from './components/TreeView'
import NodeTree from './static/NodeTree'
import {ConceptUsageView} from './views/ConceptUsageView'

/**
 * #### Default Desk Structure for Concept and Concept Scheme
 * Sets defaultDocumentNode. Consider exporting in the future,
 * if there is a use case for mixing taxonomy views in the main
 * desk structure.
 */
export const structure = (S: StructureBuilder): ListBuilder =>
  S.list()
    .title('Taxonomy Manager')
    .items([
      S.documentTypeListItem('skosConceptScheme').title('Concept Schemes'),
      S.documentTypeListItem('skosConcept').title('Concepts'),
    ])

// set default document node here — so that if users want concepts
// and schemes elsewhere in desk, they'll get the right views.
export const defaultDocumentNode: DefaultDocumentNodeResolver = (S, {schemaType}) => {
  // Conditionally return a different configuration based on the schema type
  switch (schemaType) {
    case 'skosConceptScheme':
      return S.document().views([
        S.view.component(TreeView).title('Tree View').icon(NodeTree),
        S.view.form().icon(EditIcon),
      ])
    case 'skosConcept':
      return S.document().views([
        S.view.form().icon(EditIcon),
        S.view
          .component(ConceptUsageView)
          .title('Usage')
          .icon(DocumentsIcon)
          .options({mode: 'tagged'}),
      ])
    default:
      return S.document().views([S.view.form().icon(EditIcon)])
  }
}
