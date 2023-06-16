import {TreeView} from './components/TreeView'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const structure = (S: any) =>
  S.list()
    .title('Taxonomy Manager')
    .items([
      S.listItem()
        .title('Concept Schemes')
        .schemaType('skosConceptScheme')
        .child(
          S.documentTypeList('skosConceptScheme')
            .title('Concept Schemes')
            .child((id: string) =>
              S.document()
                .schemaType('skosConceptScheme')
                .documentId(id)
                .views([S.view.component(TreeView).title('Tree View'), S.view.form()])
            )
        ),
      S.documentTypeListItem('skosConcept').title('Concepts'),
    ])
