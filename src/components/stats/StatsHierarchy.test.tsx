import {screen, within} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {ReleaseContext, SchemeContext} from '../../context'
import {TaxonomyPortProvider} from '../../seams/TaxonomyPortContext'
import {createFakeDataPort, type FakeDataPortConfig} from '../../test/FakeDataPort'
import {renderWithUi} from '../../test/renderWithUi'
import type {ConceptSchemeDocument, DocumentConcepts} from '../../types'

import {StatsHierarchy} from './StatsHierarchy'

const mocks = vi.hoisted(() => ({usePaneRouter: vi.fn()}))

vi.mock('sanity/structure', async (importOriginal) => ({
  ...(await importOriginal<typeof import('sanity/structure')>()),
  usePaneRouter: mocks.usePaneRouter,
}))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.usePaneRouter.mockReturnValue({routerPanesState: [[{id: 'scheme-1'}]], groupIndex: 0})
})

const scheme = {
  displayed: {_id: 'scheme-1', _type: 'skosConceptScheme', title: 'Subjects'},
} as unknown as ConceptSchemeDocument

const TREE: DocumentConcepts = {
  topConcepts: [
    {
      id: 'history',
      prefLabel: 'History',
      childConcepts: [{id: 'classical', prefLabel: 'Classical History', level: 1}],
    },
  ],
  concepts: [],
}

function render(config: FakeDataPortConfig, perspective?: string) {
  const port = createFakeDataPort({tree: TREE, ...config})
  const result = renderWithUi(
    <TaxonomyPortProvider port={port}>
      <SchemeContext.Provider value={scheme}>
        <ReleaseContext.Provider value={perspective}>
          <StatsHierarchy />
        </ReleaseContext.Provider>
      </SchemeContext.Provider>
    </TaxonomyPortProvider>,
  )
  return {port, result}
}

function row(label: string): HTMLElement {
  const button = screen.getByRole('button', {name: new RegExp(`^${label}`)})
  const card = button.closest('[data-ui="Card"]')
  if (!card) throw new Error(`No row found for ${label}`)
  return card as HTMLElement
}

describe('StatsHierarchy', () => {
  it('renders the tree with each term’s count', () => {
    render({usage: {history: 0, classical: 71}})

    expect(within(row('History')).getByText('0')).toBeTruthy()
    expect(within(row('Classical History')).getByText('71')).toBeTruthy()
  })

  it('heads the measure lane, so the numbers say what they are', () => {
    render({usage: {}})

    expect(screen.getByText('Tagged Resources')).toBeTruthy()
  })

  it('offers Collapse and Expand when something in the scheme has children', () => {
    render({usage: {}})

    expect(screen.getByRole('button', {name: 'Collapse'})).toBeTruthy()
    expect(screen.getByRole('button', {name: 'Expand'})).toBeTruthy()
  })

  // Hidden rather than absent. These buttons are the tallest thing in the
  // header, so dropping them shrinks it and the rule rides up against the
  // column label — a flat scheme's header sat visibly tighter than a nested
  // one's. The slot is held open by the controls themselves, which is how the
  // row holds its caret slot.
  it('hides the collapse controls in a flat scheme but keeps their height', () => {
    const port = createFakeDataPort({
      tree: {topConcepts: [{id: 'a', prefLabel: 'Alone'}], concepts: []},
      usage: {a: 1},
    })
    renderWithUi(
      <TaxonomyPortProvider port={port}>
        <SchemeContext.Provider value={scheme}>
          <ReleaseContext.Provider value={undefined}>
            <StatsHierarchy />
          </ReleaseContext.Provider>
        </SchemeContext.Provider>
      </TaxonomyPortProvider>,
    )

    // Out of the accessibility tree and out of the tab order…
    expect(screen.queryByRole('button', {name: 'Collapse'})).toBeNull()
    // …but still laid out, which is the whole point.
    const reserved = document.querySelector('[aria-hidden="true"] button[tabindex="-1"]')
    expect(reserved).toBeTruthy()
    expect(screen.getByText('Collapse')).toBeTruthy()
  })

  it('shows a spinner while the tree is loading and nothing is cached', () => {
    render({loading: true, tree: null})

    expect(screen.getByText('Loading hierarchy…')).toBeTruthy()
  })

  // The two structure views are separate `S.view.component()`s, so Studio
  // unmounts one and mounts the other on a tab switch and every switch starts
  // a fresh fetch. The adapter hands the remount the tree it last saw; this is
  // the half that makes it visible. Without it the pane still drops to a
  // spinner, loses its scrollbar, and jumps sideways when the tree lands.
  it('keeps the tree on screen while a refetch is in flight', () => {
    render({loading: true})

    expect(screen.queryByText('Loading hierarchy…')).toBeNull()
    expect(screen.getByRole('button', {name: /^History/})).toBeTruthy()
  })
})

describe('StatsHierarchy — what it asks the port for', () => {
  // Every id in the tree, sorted. Sorted because the list is a query parameter
  // and `useListeningQuery` memoizes params by their JSON: an unstable order
  // would resubscribe the listener on every tree update.
  it('asks about every concept in the tree, in a stable order', () => {
    const {port} = render({usage: {}})

    expect(port.lastUsageParams?.ids).toEqual(['classical', 'history'])
  })

  // The rule ADR 0005 drew from the insert picker: a query takes its
  // perspective from the same place the tree does, never choosing its own.
  // A count beside a row has to be counting the world that row came from.
  it('counts under the same perspective it reads the tree under', () => {
    const {port} = render({usage: {}}, 'rMyRelease')

    expect(port.lastWatchParams?.perspective).toBe('rMyRelease')
    expect(port.lastUsageParams?.perspective).toBe('rMyRelease')
  })
})
