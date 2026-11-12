import {cleanup, render, screen} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {SchemeContext, TreeContext} from '../../context'
import {TaxonomyPortProvider} from '../../seams/TaxonomyPortContext'
import {createFakeDataPort} from '../../test/FakeDataPort'
import {UiProviders} from '../../test/renderWithUi'
import type {ConceptSchemeDocument, DocumentConcepts} from '../../types'
import {TreeStructure} from '../TreeStructure'

import {StatsStructure} from './StatsStructure'

/**
 * The Tree View and the governance view render the same hierarchy in sibling
 * tabs on one document. An editor switching between them expects the tree to
 * sit still — so every leading slot one view holds open, the other must hold
 * open too, or every label jumps sideways by a control's width.
 *
 * This asserts that directly, by rendering both from one tree and comparing
 * the scaffolding row by row. The alternative is to test each view against a
 * description of the rule, which is how the two drifted apart in the first
 * place: the governance row reserved a caret on every childless row and no
 * grip at all, each defensible alone and wrong side by side.
 */

const mocks = vi.hoisted(() => ({usePaneRouter: vi.fn()}))

vi.mock('sanity/structure', async (importOriginal) => ({
  ...(await importOriginal<typeof import('sanity/structure')>()),
  usePaneRouter: mocks.usePaneRouter,
}))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.usePaneRouter.mockReturnValue({routerPanesState: [[{id: 'scheme-1'}]], groupIndex: 0})
})

afterEach(cleanup)

const scheme = {
  displayed: {
    _id: 'scheme-1',
    _type: 'skosConceptScheme',
    title: 'Subjects',
    topConcepts: [{_key: 'k1', _ref: 't1', _type: 'reference'}],
  },
} as unknown as ConceptSchemeDocument

/** Every shape of row the tree has: top with and without children, a childless
 *  child, a nested child, and a root orphan — which is what makes the top
 *  concepts reserve a grip at all. */
const TREE: DocumentConcepts = {
  topConcepts: [
    {
      id: 't1',
      prefLabel: 'Anthropology',
      childConcepts: [
        {id: 'c1', prefLabel: 'Sociology', level: 1},
        {
          id: 'c2',
          prefLabel: 'Archaeology',
          level: 1,
          childConcepts: [{id: 'c3', prefLabel: 'Prehistory', level: 2}],
        },
      ],
    },
    {id: 't2', prefLabel: 'Methods'},
  ],
  concepts: [{id: 'o1', prefLabel: 'Loose Term', isOrphan: true}],
}

const LABELS = ['Anthropology', 'Methods', 'Loose Term', 'Sociology', 'Archaeology', 'Prehistory']

const treeContext = {
  globalVisibility: {treeId: 'test', treeVisibility: 'open' as const},
  concepts: TREE,
  usage: new Map<string, number>(),
  usageMax: 0,
}

function renderTreeView() {
  return render(
    <TaxonomyPortProvider port={createFakeDataPort({tree: TREE})}>
      <SchemeContext.Provider value={scheme}>
        <TreeContext.Provider value={treeContext}>
          <TreeStructure concepts={TREE} inputComponent={false} selectConcept={() => undefined} />
        </TreeContext.Provider>
      </SchemeContext.Provider>
    </TaxonomyPortProvider>,
    {wrapper: UiProviders},
  )
}

function renderStatsView() {
  return render(
    <SchemeContext.Provider value={scheme}>
      <TreeContext.Provider value={treeContext}>
        <StatsStructure concepts={TREE} />
      </TreeContext.Provider>
    </SchemeContext.Provider>,
    {wrapper: UiProviders},
  )
}

/**
 * How many scaffolding controls sit to the left of a row's label — carets,
 * reserved or real, and the drag grip. Counted as every button in the row's
 * own control group except the label button itself, so it counts hidden
 * controls too: holding a slot open is exactly what is being compared.
 */
function leadingSlots(label: string): number {
  const labelButton = screen.getByRole('button', {name: new RegExp(`^${label}`)})
  const group = labelButton.closest('[data-ui="Flex"]')
  if (!group) throw new Error(`No control group for ${label}`)
  return group.querySelectorAll('button').length - 1
}

function slotsByRow(): Record<string, number> {
  return Object.fromEntries(LABELS.map((label) => [label, leadingSlots(label)]))
}

describe('the two views line up', () => {
  it('gives every row the same leading slots in both views', () => {
    renderTreeView()
    const treeSlots = slotsByRow()
    cleanup()

    renderStatsView()
    const statsSlots = slotsByRow()

    expect(statsSlots).toEqual(treeSlots)
  })

  // Guards the comparison above from passing because both sides are zero.
  it('counts slots that actually exist', () => {
    renderTreeView()

    expect(leadingSlots('Sociology')).toBeGreaterThan(0)
    expect(leadingSlots('Anthropology')).toBeGreaterThan(0)
  })

  // The grip is the slot the governance view was missing. It is reserved on
  // the top concepts only because a root orphan sits beside them.
  it('reserves the grip in the governance view wherever the Tree View draws one', () => {
    renderStatsView()

    const group = screen.getByRole('button', {name: /^Anthropology/}).closest('[data-ui="Flex"]')!
    expect(group.querySelector('[data-sanity-icon="drag-handle"]')).toBeTruthy()
  })
})
