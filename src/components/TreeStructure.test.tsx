import {screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {SchemeContext} from '../context'
import {TaxonomyPortProvider} from '../seams/TaxonomyPortContext'
import {createFakeDataPort} from '../test/FakeDataPort'
import {renderWithUi} from '../test/renderWithUi'
import type {ConceptSchemeDocument, DocumentConcepts} from '../types'

import {TreeStructure} from './TreeStructure'

// The row components reach Studio's pane router through ConceptDetailLink and
// useCreateConcept. Neither is what these tests exercise — they pin the shape of
// the rendered tree — so a stub is enough.
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

function renderTree(concepts: DocumentConcepts | null) {
  return renderWithUi(
    <TaxonomyPortProvider port={createFakeDataPort()}>
      <SchemeContext.Provider value={scheme}>
        <TreeStructure concepts={concepts} inputComponent={false} selectConcept={() => undefined} />
      </SchemeContext.Provider>
    </TaxonomyPortProvider>,
  )
}

/** A row's own container, which also holds the rows nested beneath it. */
function row(label: string) {
  const button = screen.getByRole('button', {name: new RegExp(`^${label}`)})
  const container = button.closest('.open')
  if (!container) throw new Error(`No row container found for ${label}`)
  return container as HTMLElement
}

/**
 * A row's own left-hand controls — grip, caret, label — scoped to that Flex so
 * the rows nested beneath it are excluded, which `row` deliberately is not.
 */
function rowControls(label: string) {
  const button = screen.getByRole('button', {name: new RegExp(`^${label}`)})
  const group = button.closest('[data-ui="Flex"]')
  if (!group) throw new Error(`No control group found for ${label}`)
  return group as HTMLElement
}

/**
 * The hidden caret a row renders to hold its slot open, if it renders one. It
 * is invisible to role queries by design — `visibility: hidden` and
 * `aria-hidden` — so it is found by its icon, which is what tells it apart from
 * the drag grip beside it.
 */
function reservedCaret(label: string) {
  return rowControls(label).querySelector(
    'button[aria-hidden="true"] [data-sanity-icon="chevron-right"]',
  )
}

describe('TreeStructure (what renders at the root)', () => {
  it('renders the empty-state guide when the scheme has no concepts', () => {
    renderTree({topConcepts: [], concepts: []})
    expect(screen.queryByRole('button', {name: /^Animals/})).not.toBeInTheDocument()
  })

  it('renders top concepts at the root', () => {
    renderTree({topConcepts: [{id: 'c1', prefLabel: 'Animals'}], concepts: []})
    expect(screen.getByRole('button', {name: /^Animals/})).toBeInTheDocument()
  })

  it('renders orphan concepts at the root', () => {
    renderTree({topConcepts: [], concepts: [{id: 'c9', prefLabel: 'Unfiled', isOrphan: true}]})
    expect(screen.getByRole('button', {name: /^Unfiled/})).toBeInTheDocument()
  })

  it('renders a non-orphan concept only in its nested position, never at the root', () => {
    renderTree({
      topConcepts: [
        {id: 'c1', prefLabel: 'Animals', childConcepts: [{id: 'c2', prefLabel: 'Birds', level: 1}]},
      ],
      // Birds is also a member of the scheme's concepts[], but it has a broader
      // term in this scheme, so GROQ marks it isOrphan: false and the root skips it.
      concepts: [{id: 'c2', prefLabel: 'Birds', isOrphan: false}],
    })

    expect(screen.getAllByRole('button', {name: /^Birds/})).toHaveLength(1)
    expect(row('Animals')).toContainElement(screen.getByRole('button', {name: /^Birds/}))
  })
})

describe('TreeStructure (the reserved caret slot)', () => {
  it('holds the caret slot open on a child with no children of its own', () => {
    renderTree({
      topConcepts: [
        {
          id: 'c1',
          prefLabel: 'Animals',
          childConcepts: [
            {
              id: 'c2',
              prefLabel: 'Birds',
              level: 1,
              childConcepts: [{id: 'c3', prefLabel: 'Falcons', level: 2}],
            },
            {id: 'c4', prefLabel: 'Fish', level: 1},
          ],
        },
      ],
      concepts: [],
    })

    // Fish has no caret of its own, so it reserves the slot to keep its label
    // on the same edge as the caret-bearing Birds beside it.
    expect(reservedCaret('Fish')).toBeInTheDocument()
    expect(reservedCaret('Birds')).toBeNull()
  })

  it('leaves the root alone, where a row has no siblings nested under a shared parent', () => {
    renderTree({
      topConcepts: [{id: 'c1', prefLabel: 'Animals'}],
      concepts: [{id: 'c9', prefLabel: 'Unfiled', isOrphan: true}],
    })

    // Both are childless, and neither reserves: the root keeps a quiet left
    // edge rather than holding space open for a caret that may never come.
    expect(reservedCaret('Animals')).toBeNull()
    expect(reservedCaret('Unfiled')).toBeNull()
  })
})

describe('TreeStructure (how the hierarchy nests)', () => {
  it('nests a child concept inside its parent row', () => {
    renderTree({
      topConcepts: [
        {id: 'c1', prefLabel: 'Animals', childConcepts: [{id: 'c2', prefLabel: 'Birds', level: 1}]},
      ],
      concepts: [],
    })

    expect(row('Animals')).toContainElement(screen.getByRole('button', {name: /^Birds/}))
  })

  it('indents each nested level by one step', () => {
    renderTree({
      topConcepts: [
        {id: 'c1', prefLabel: 'Animals', childConcepts: [{id: 'c2', prefLabel: 'Birds', level: 1}]},
      ],
      concepts: [],
    })

    // One control wide, from useControlWidth. Pinned against the default theme
    // so that a change to the tree's left edge is a deliberate act — jsdom has
    // no layout engine, so this is the value, not proof that it lines up.
    const nested = row('Birds').closest('[style*="margin-left"]')

    expect(nested).toHaveStyle({marginLeft: '25px'})
  })

  it('nests each generation inside the one above it, down to level five', () => {
    renderTree({
      topConcepts: [
        {
          id: 'c1',
          prefLabel: 'Animals',
          childConcepts: [
            {
              id: 'c2',
              prefLabel: 'Birds',
              level: 1,
              childConcepts: [
                {
                  id: 'c3',
                  prefLabel: 'Raptors',
                  level: 2,
                  childConcepts: [
                    {
                      id: 'c4',
                      prefLabel: 'Falcons',
                      level: 3,
                      childConcepts: [
                        {
                          id: 'c5',
                          prefLabel: 'Kestrels',
                          level: 4,
                          // MAX_VISIBLE_LEVEL is 5: this is the row that carries
                          // the structure notice in place of its two actions.
                          childConcepts: [{id: 'c6', prefLabel: 'Merlins', level: 5}],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      concepts: [],
    })

    const labels = ['Animals', 'Birds', 'Raptors', 'Falcons', 'Kestrels']
    labels.forEach((label) =>
      expect(screen.getByRole('button', {name: new RegExp(`^${label}`)})).toBeInTheDocument(),
    )

    // Every generation sits inside the row of the one above it.
    labels.slice(0, -1).forEach((label, i) => {
      expect(row(label)).toContainElement(
        screen.getByRole('button', {name: new RegExp(`^${labels[i + 1]}`)}),
      )
    })
  })

  it('renders each occurrence of a concept that has more than one broader term', () => {
    renderTree({
      topConcepts: [
        {
          id: 'c1',
          prefLabel: 'Animals',
          childConcepts: [{id: 'c3', prefLabel: 'Carbon', level: 1}],
        },
        {
          id: 'c2',
          prefLabel: 'Minerals',
          childConcepts: [{id: 'c3', prefLabel: 'Carbon', level: 1}],
        },
      ],
      concepts: [],
    })

    expect(screen.getAllByRole('button', {name: /^Carbon/})).toHaveLength(2)
    expect(row('Animals')).toContainElement(screen.getAllByRole('button', {name: /^Carbon/})[0])
    expect(row('Minerals')).toContainElement(screen.getAllByRole('button', {name: /^Carbon/})[1])
  })
})

describe('TreeStructure (the reserved action slot at the depth cap)', () => {
  // A row at the maximum depth trades two actions — add and insert — for one
  // structure notice, so it offers one control fewer than every row above it.
  // Its own left-hand group flexes, so that missing slot pushes the row's
  // status markers and overflow menu a step to the right and breaks the
  // vertical line the markers otherwise hold. One reserved slot squares it.
  const deep = {
    topConcepts: [
      {
        id: 'c1',
        prefLabel: 'Animals',
        childConcepts: [
          {
            id: 'c2',
            prefLabel: 'Birds',
            level: 1,
            childConcepts: [
              {
                id: 'c3',
                prefLabel: 'Raptors',
                level: 2,
                childConcepts: [
                  {
                    id: 'c4',
                    prefLabel: 'Falcons',
                    level: 3,
                    childConcepts: [
                      {
                        id: 'c5',
                        prefLabel: 'Kestrels',
                        level: 4,
                        // MAX_VISIBLE_LEVEL is 5: this is the row that carries
                        // the structure notice in place of its two actions.
                        childConcepts: [{id: 'c6', prefLabel: 'Merlins', level: 5}],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    concepts: [],
  } as unknown as DocumentConcepts

  /** Every action button in a row, reserved ones included. */
  function actionCount(label: string) {
    const button = screen.getByRole('button', {name: new RegExp(`^${label}`)})
    const actions = button
      .closest('[data-ui="Flex"]')
      ?.parentElement?.querySelectorAll(
        ':scope > [data-ui="Inline"] button, :scope > [data-ui="Inline"] > * > button',
      )
    return actions?.length ?? 0
  }

  it('gives a row at the cap the same number of action slots as one above it', () => {
    renderTree(deep)

    expect(actionCount('Merlins')).toBe(actionCount('Falcons'))
  })

  it('reserves the slot rather than leaving a gap, so it takes no focus', () => {
    renderTree(deep)

    const capped = screen.getByRole('button', {name: /^Merlins/}).closest('.open')!
    const reserved = capped.querySelector('button[aria-hidden="true"][tabindex="-1"]')
    expect(reserved).toBeTruthy()
  })
})
