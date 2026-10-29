import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {ReleaseContext, SchemeContext} from '../context'
import {TaxonomyPortProvider} from '../seams/TaxonomyPortContext'
import {createFakeDataPort} from '../test/FakeDataPort'
import {renderWithUi} from '../test/renderWithUi'
import type {ConceptSchemeDocument, DocumentConcepts} from '../types'

import {Hierarchy} from './Hierarchy'

// Concept links + new-pane navigation read Studio's pane router, which isn't
// present in jsdom. Stub it — navigation isn't what these tests exercise, but
// the pane open beside the tree drives which row is marked current.
const mocks = vi.hoisted(() => ({usePaneRouter: vi.fn()}))

vi.mock('sanity/structure', async (importOriginal) => ({
  ...(await importOriginal<typeof import('sanity/structure')>()),
  usePaneRouter: mocks.usePaneRouter,
}))

/** Tree pane at index 0, so the concept pane — if any — is the group at index 1. */
function panes(openId?: string) {
  return {
    routerPanesState: openId ? [[{id: 'scheme-1'}], [{id: openId}]] : [[{id: 'scheme-1'}]],
    groupIndex: 0,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.usePaneRouter.mockReturnValue(panes())
})

const scheme = {
  displayed: {_id: 'scheme-1', _type: 'skosConceptScheme', title: 'Test Scheme'},
} as unknown as ConceptSchemeDocument

function renderHierarchy(
  port: ReturnType<typeof createFakeDataPort>,
  releaseContext: string | undefined = undefined,
) {
  return renderWithUi(
    <TaxonomyPortProvider port={port}>
      <SchemeContext.Provider value={scheme}>
        <ReleaseContext.Provider value={releaseContext}>
          <Hierarchy inputComponent={false} />
        </ReleaseContext.Provider>
      </SchemeContext.Provider>
    </TaxonomyPortProvider>,
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

  it('optimistically removes the concept from the tree before the listener catches up', async () => {
    // The fake's watch data stays static, standing in for the listener's refetch lag.
    const tree: DocumentConcepts = {
      topConcepts: [{id: 'concept-1', prefLabel: 'Animals'}],
      concepts: [],
    }
    renderHierarchy(createFakeDataPort({tree}))

    expect(screen.getByRole('button', {name: /Animals/})).toBeInTheDocument()
    await userEvent.setup().click(screen.getByLabelText('Remove this concept from this scheme'))
    expect(screen.queryByRole('button', {name: /Animals/})).not.toBeInTheDocument()
  })

  it('marks only the concept open in the pane to the right', () => {
    mocks.usePaneRouter.mockReturnValue(panes('concept-2'))
    const tree: DocumentConcepts = {
      topConcepts: [
        {id: 'concept-1', prefLabel: 'Animals'},
        {id: 'concept-2', prefLabel: 'Minerals'},
      ],
      concepts: [],
    }
    renderHierarchy(createFakeDataPort({tree}))

    expect(screen.getByRole('button', {name: /Minerals/})).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('button', {name: /Animals/})).not.toHaveAttribute('aria-current')
  })

  it('marks every occurrence of a concept with more than one broader term', () => {
    mocks.usePaneRouter.mockReturnValue(panes('concept-3'))
    const tree: DocumentConcepts = {
      topConcepts: [
        {
          id: 'concept-1',
          prefLabel: 'Animals',
          childConcepts: [{id: 'concept-3', prefLabel: 'Carbon', level: 1}],
        },
        {
          id: 'concept-2',
          prefLabel: 'Minerals',
          childConcepts: [{id: 'concept-3', prefLabel: 'Carbon', level: 1}],
        },
      ],
      concepts: [],
    }
    renderHierarchy(createFakeDataPort({tree}))

    const occurrences = screen.getAllByRole('button', {name: /Carbon/})
    expect(occurrences).toHaveLength(2)
    occurrences.forEach((row) => expect(row).toHaveAttribute('aria-current', 'true'))
  })
})
