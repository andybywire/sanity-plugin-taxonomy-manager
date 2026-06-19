import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {ReleaseContext, SchemeContext} from '../context'
import {TaxonomyPortProvider} from '../seams/TaxonomyPortContext'
import {createFakeDataPort} from '../test/FakeDataPort'
import {renderWithUi} from '../test/renderWithUi'
import type {ConceptSchemeDocument, DocumentConcepts} from '../types'

import {Hierarchy} from './Hierarchy'

// Concept links + new-pane navigation read Studio's pane router, which isn't
// present in jsdom. Stub it — navigation isn't what these tests exercise.
vi.mock('sanity/structure', async (importOriginal) => ({
  ...(await importOriginal<typeof import('sanity/structure')>()),
  usePaneRouter: () => ({routerPanesState: [], groupIndex: 0}),
}))

const scheme = {
  displayed: {_id: 'scheme-1', _type: 'skosConceptScheme', title: 'Test Scheme'},
} as unknown as ConceptSchemeDocument

function renderHierarchy(
  port: ReturnType<typeof createFakeDataPort>,
  releaseContext: string | undefined = undefined
) {
  return renderWithUi(
    <TaxonomyPortProvider port={port}>
      <SchemeContext.Provider value={scheme}>
        <ReleaseContext.Provider value={releaseContext}>
          <Hierarchy inputComponent={false} />
        </ReleaseContext.Provider>
      </SchemeContext.Provider>
    </TaxonomyPortProvider>
  )
}

describe('Hierarchy (trunk watch seam)', () => {
  it('watches the trunk tree with the document id and perspective', () => {
    const port = createFakeDataPort({loading: true})
    renderHierarchy(port)

    expect(screen.getByText('Loading hierarchy…')).toBeInTheDocument()
    expect(port.lastWatchParams).toEqual({
      mode: 'trunk',
      documentId: 'scheme-1',
      perspective: undefined,
    })
  })

  it('renders the concepts delivered by the port', () => {
    const tree: DocumentConcepts = {
      topConcepts: [{id: 'concept-1', prefLabel: 'Animals'}],
      concepts: [],
    }
    renderHierarchy(createFakeDataPort({tree}))

    expect(screen.getByRole('button', {name: /Animals/})).toBeInTheDocument()
  })

  it('routes a concept removal through the port as a remove plan', async () => {
    const tree: DocumentConcepts = {
      topConcepts: [{id: 'concept-1', prefLabel: 'Animals'}],
      concepts: [],
    }
    const port = createFakeDataPort({tree})
    renderHierarchy(port)

    const removeAction = screen.getByLabelText('Remove this concept from this scheme')
    await userEvent.setup().click(removeAction)

    expect(port.appliedPlans).toHaveLength(1)
    expect(port.appliedPlans[0]).toMatchObject({
      kind: 'remove',
      unsetPaths: ['topConcepts[_ref=="concept-1"]'],
    })
  })
})
