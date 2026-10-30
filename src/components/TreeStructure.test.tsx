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
        <TreeStructure
          concepts={concepts}
          inputComponent={false}
          selectConcept={() => undefined}
        />
      </SchemeContext.Provider>
    </TaxonomyPortProvider>,
  )
}

/** A row's own container, which also holds the rows nested beneath it. */
function row(label: string) {
  const button = screen.getByRole('button', {name: new RegExp(label)})
  const container = button.closest('.open')
  if (!container) throw new Error(`No row container found for ${label}`)
  return container as HTMLElement
}

describe('TreeStructure (what renders at the root)', () => {
  it('renders the empty-state guide when the scheme has no concepts', () => {
    renderTree({topConcepts: [], concepts: []})
    expect(screen.queryByRole('button', {name: /Animals/})).not.toBeInTheDocument()
  })

  it('renders top concepts at the root', () => {
    renderTree({topConcepts: [{id: 'c1', prefLabel: 'Animals'}], concepts: []})
    expect(screen.getByRole('button', {name: /Animals/})).toBeInTheDocument()
  })

  it('renders orphan concepts at the root', () => {
    renderTree({topConcepts: [], concepts: [{id: 'c9', prefLabel: 'Unfiled', isOrphan: true}]})
    expect(screen.getByRole('button', {name: /Unfiled/})).toBeInTheDocument()
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

    expect(screen.getAllByRole('button', {name: /Birds/})).toHaveLength(1)
    expect(row('Animals')).toContainElement(screen.getByRole('button', {name: /Birds/}))
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

    expect(row('Animals')).toContainElement(screen.getByRole('button', {name: /Birds/}))
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
                      childConcepts: [{id: 'c5', prefLabel: 'Kestrels', level: 4}],
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
      expect(screen.getByRole('button', {name: new RegExp(label)})).toBeInTheDocument(),
    )

    // Every generation sits inside the row of the one above it.
    labels.slice(0, -1).forEach((label, i) => {
      expect(row(label)).toContainElement(
        screen.getByRole('button', {name: new RegExp(labels[i + 1])}),
      )
    })
  })

  it('renders each occurrence of a concept that has more than one broader term', () => {
    renderTree({
      topConcepts: [
        {id: 'c1', prefLabel: 'Animals', childConcepts: [{id: 'c3', prefLabel: 'Carbon', level: 1}]},
        {id: 'c2', prefLabel: 'Minerals', childConcepts: [{id: 'c3', prefLabel: 'Carbon', level: 1}]},
      ],
      concepts: [],
    })

    expect(screen.getAllByRole('button', {name: /Carbon/})).toHaveLength(2)
    expect(row('Animals')).toContainElement(screen.getAllByRole('button', {name: /Carbon/})[0])
    expect(row('Minerals')).toContainElement(screen.getAllByRole('button', {name: /Carbon/})[1])
  })
})
