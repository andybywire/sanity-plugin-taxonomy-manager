import {Container} from '@sanity/ui'
import {usePerspective} from 'sanity'

import {SchemeDescription} from '../components/SchemeDescription'
import {StatsHierarchy} from '../components/stats'
import {ReleaseContext, SchemeContext} from '../context'
import type {ConceptSchemeDocument} from '../types'

/**
 * #### Stats View
 * The governance view: every concept in a scheme with a count of the resources
 * tagged with it.
 *
 * A sibling `S.view.component()` beside the Tree View on the same document
 * node, which is what makes clicking a concept work with no router changes —
 * the two views share a pane group, so `core/activeConcept` reads the open
 * concept the same way from either, and switching tabs preserves the
 * highlight by construction.
 *
 * Provides the same two contexts `TreeView` provides, for the same reasons:
 * the scheme document the hierarchy hangs from, and the perspective every
 * query under it runs in.
 *
 * Typed by its props rather than as a `UserViewComponent`, which is how
 * `TreeView` — this view's sibling on the same document node — is written.
 * That type's `document` is a `Partial<SanityDocument>` shape, which a
 * `ConceptSchemeDocument` is not assignable from.
 */
export const StatsView = ({document}: {document?: ConceptSchemeDocument}) => {
  const {selectedPerspectiveName} = usePerspective()

  return (
    <SchemeContext.Provider value={document || ({} as ConceptSchemeDocument)}>
      <ReleaseContext.Provider value={selectedPerspectiveName}>
        <Container width={1}>
          {/* The same block the Tree View renders, in the same place. It is
              what makes the two trees start at the same height, so switching
              tabs does not shift every row. */}
          <SchemeDescription description={document?.displayed?.description} />
          <StatsHierarchy />
        </Container>
      </ReleaseContext.Provider>
    </SchemeContext.Provider>
  )
}

export default StatsView
