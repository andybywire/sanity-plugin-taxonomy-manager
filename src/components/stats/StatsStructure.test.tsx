import {screen, within} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {SchemeContext, TreeContext} from '../../context'
import {renderWithUi} from '../../test/renderWithUi'
import type {ConceptSchemeDocument, DocumentConcepts} from '../../types'

import {StatsStructure} from './StatsStructure'
import {TRACK_WIDTH} from './lane'

// The rows reach Studio's pane router through ConceptDetailLink. That is not
// what these tests exercise — they pin what a row displays — so a stub is enough.
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
  displayed: {_id: 'scheme-1', _type: 'skosConceptScheme', title: 'Test Scheme'},
} as unknown as ConceptSchemeDocument

const TREE: DocumentConcepts = {
  topConcepts: [
    {
      id: 'anthropology',
      prefLabel: 'Anthropology',
      childConcepts: [{id: 'sociology', prefLabel: 'Sociology', level: 1}],
    },
    {id: 'methods', prefLabel: 'Methods'},
  ],
  concepts: [],
}

function renderStats(
  usage: ReadonlyMap<string, number> | null,
  usageMax: number,
  tree: DocumentConcepts = TREE,
) {
  return renderWithUi(
    <SchemeContext.Provider value={scheme}>
      <TreeContext.Provider
        value={{
          globalVisibility: {treeId: 'test', treeVisibility: 'open'},
          concepts: tree,
          usage,
          usageMax,
        }}
      >
        <StatsStructure concepts={tree} />
      </TreeContext.Provider>
    </SchemeContext.Provider>,
  )
}

/** One row's own Card — the nested rows beneath it are siblings of it, not inside. */
function row(label: string): HTMLElement {
  const button = screen.getByRole('button', {name: new RegExp(`^${label}`)})
  const card = button.closest('[data-ui="Card"]')
  if (!card) throw new Error(`No row found for ${label}`)
  return card as HTMLElement
}

/**
 * A row's bar track. Selected by its own attribute rather than by
 * `aria-hidden`, which the reserved caret beside it also carries.
 */
function track(label: string): HTMLElement {
  const el = row(label).querySelector('[data-taxonomy-usage-bar]')
  if (!el) throw new Error(`No bar track for ${label}`)
  return el as HTMLElement
}

/** The filled portion of a row's bar, or null where the term is unused. */
function fill(label: string): HTMLElement | null {
  return track(label).firstElementChild as HTMLElement | null
}

describe('StatsStructure', () => {
  it('renders a row for every top concept and its children', () => {
    renderStats(new Map([['anthropology', 19]]), 19)

    expect(screen.getByRole('button', {name: /^Anthropology/})).toBeTruthy()
    expect(screen.getByRole('button', {name: /^Sociology/})).toBeTruthy()
    expect(screen.getByRole('button', {name: /^Methods/})).toBeTruthy()
  })

  it('shows each term its own count', () => {
    renderStats(
      new Map([
        ['anthropology', 19],
        ['sociology', 148],
        ['methods', 0],
      ]),
      148,
    )

    expect(within(row('Anthropology')).getByText('19')).toBeTruthy()
    expect(within(row('Sociology')).getByText('148')).toBeTruthy()
    expect(within(row('Methods')).getByText('0')).toBeTruthy()
  })

  // The whole value of this view is that its zeros can be trusted. A count that
  // has not arrived is not a zero, and rendering it as one would quietly invent
  // the finding the view exists to report.
  it('shows no number at all while the counts are still in flight', () => {
    renderStats(null, 0)

    expect(within(row('Anthropology')).queryByText('0')).toBeNull()
    expect(within(row('Methods')).queryByText('0')).toBeNull()
  })

  it('shows zeros once the counts land on a scheme where nothing is tagged', () => {
    renderStats(
      new Map([
        ['anthropology', 0],
        ['sociology', 0],
        ['methods', 0],
      ]),
      0,
    )

    expect(within(row('Anthropology')).getByText('0')).toBeTruthy()
    expect(within(row('Methods')).getByText('0')).toBeTruthy()
  })
})

describe('StatsStructure — the bar', () => {
  it('fills in proportion to the busiest term in the scheme', () => {
    renderStats(
      new Map([
        ['anthropology', 19],
        ['sociology', 148],
      ]),
      148,
    )

    expect(fill('Sociology')?.style.width).toBe('100%')
    // 19/148, the share the B.3 design draws as 12.8%.
    expect(parseFloat(fill('Anthropology')!.style.width)).toBeCloseTo(12.84, 1)
  })

  // A zero-length bar is invisible, and invisible is exactly wrong for the
  // thing a steward opens this view to find. The track stays; only the fill goes.
  it('draws an empty track for an unused term, not nothing', () => {
    renderStats(new Map([['methods', 0]]), 148)

    expect(track('Methods')).toBeTruthy()
    expect(track('Methods').style.width).toBe(`${TRACK_WIDTH}px`)
    expect(fill('Methods')).toBeNull()
  })

  it('draws no fill anywhere when no term in the scheme is tagged', () => {
    renderStats(
      new Map([
        ['anthropology', 0],
        ['methods', 0],
      ]),
      0,
    )

    expect(fill('Anthropology')).toBeNull()
    expect(fill('Methods')).toBeNull()
  })

  it('hides the bar from assistive technology, since the count says the same thing', () => {
    renderStats(new Map([['anthropology', 19]]), 19)

    expect(track('Anthropology').getAttribute('aria-hidden')).toBe('true')
  })
})

describe('StatsStructure — row structure', () => {
  // A control cannot contain controls: it is invalid, and a keyboard cannot
  // reach the inner one. The label is the button; the measure lane sits beside it.
  it('keeps the count and bar outside the label button', () => {
    renderStats(new Map([['anthropology', 19]]), 19)

    const label = screen.getByRole('button', {name: /^Anthropology/})
    expect(label.querySelector('button')).toBeNull()
    expect(label.querySelector('[data-taxonomy-usage-bar]')).toBeNull()
    expect(within(label).queryByText('19')).toBeNull()
  })

  // Which leading slots a row holds open is now asserted against the Tree
  // View directly, in alignment.test.tsx, rather than against a description of
  // the rule here — the two descriptions are what drifted apart.
})
