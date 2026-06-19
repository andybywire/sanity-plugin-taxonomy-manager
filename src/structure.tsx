import {EditIcon, DocumentsIcon} from '@sanity/icons'
import type {StructureBuilder, ListBuilder, DefaultDocumentNodeResolver} from 'sanity/structure'

import {TreeView} from './components/TreeView'
import {TaxonomyConfigContext} from './context'
import NodeTree from './static/NodeTree'
import type {Options, TreeViewProps} from './types'
import {ConceptUseView} from './views/ConceptUseView'

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

/**
 * #### Default Document Node (factory)
 * Builds the `defaultDocumentNode` resolver, closing over plugin config so the
 * structure Tree View can read `ident` from React context — replacing the old
 * `config.ts` `getPluginConfig` singleton. Called once at plugin init, so the
 * wrapper component identity stays stable across resolver invocations.
 */
export const createDefaultDocumentNode = (
  config: {ident?: Options['ident']} = {}
): DefaultDocumentNodeResolver => {
  // Provide plugin config to the structure Tree View subtree (the only place
  // concept creation reads `ident`). Input-component trees render without this
  // provider and fall back to the context default — they never create concepts.
  const TreeViewWithConfig = (props: TreeViewProps) => (
    <TaxonomyConfigContext.Provider value={{ident: config.ident}}>
      <TreeView {...props} />
    </TaxonomyConfigContext.Provider>
  )

  return (S, {schemaType}) => {
    // Conditionally return a different configuration based on the schema type
    switch (schemaType) {
      case 'skosConceptScheme':
        return S.document().views([
          S.view.component(TreeViewWithConfig).title('Tree View').icon(NodeTree),
          S.view.form().icon(EditIcon),
        ])
      case 'skosConcept':
        return S.document().views([
          S.view.form().icon(EditIcon),
          S.view.component(ConceptUseView).title('Tagged Resources').icon(DocumentsIcon),
        ])
      default:
        return S.document().views([S.view.form().icon(EditIcon)])
    }
  }
}
