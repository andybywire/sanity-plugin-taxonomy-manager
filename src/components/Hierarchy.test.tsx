import {screen, waitFor} from '@testing-library/react'
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

/*
 * Finding things without naming them.
 *
 * Every control in the tree is an icon button or an icon menu item, so the icon
 * is the stable handle: wording is a product decision and changing it should
 * not turn the suite red. Where two controls share an icon — the scheme menu's
 * two inserts — position is used instead. Concept labels like "Animals" are
 * fixture data rather than UI copy, so matching on those is fine.
 */

/** Every button inside the currently open menu, in render order. */
function openMenuItems(): HTMLElement[] {
  const menu = document.querySelector('[data-ui="Menu"]')
  return [...(menu?.querySelectorAll('button') ?? [])] as HTMLElement[]
}

/** The open menu's item carrying this icon, or null when it is not offered. */
function menuItem(icon: string): HTMLElement | null {
  return openMenuItems().find((item) => item.querySelector(`[data-sanity-icon="${icon}"]`)) ?? null
}

/** The row card for a concept, found by its label button. */
function rowCard(label: string): HTMLElement {
  const link = screen.getByRole('button', {name: new RegExp(`^${label}`)})
  const card = link.closest('[data-ui="Card"]')
  if (!card) throw new Error(`No row card found for ${label}`)
  return card as HTMLElement
}

/** A row's button carrying this icon, or null when the row does not offer it. */
function rowButton(label: string, icon: string): HTMLElement | null {
  const el = rowCard(label).querySelector(`[data-sanity-icon="${icon}"]`)
  return (el?.closest('button') as HTMLElement) ?? null
}

/** The overflow menu above the tree, which acts on the scheme rather than a row. */
function schemeMenuButton(): HTMLElement {
  // By id: the header sits inside Cards of its own, so "not in a row card" does
  // not tell this apart from a row's menu.
  const button = document.querySelector('#scheme-actions-button')
  if (!button) throw new Error('No scheme actions menu found')
  return button as HTMLElement
}

/** Icons the tree's menu items and controls are identified by. */
const ICON = {
  menu: 'ellipsis-horizontal',
  promote: 'arrow-up',
  demote: 'arrow-down',
  move: 'arrow-right',
  remove: 'remove-circle',
  insert: 'insert-below',
  add: 'add-circle',
} as const

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

/**
 * A scheme that lists a top concept. The default fixture above has no
 * `topConcepts`, which silently switches the orphan badge off — `ConceptRow`
 * reads the scheme document, not the tree, to decide whether "orphan" means
 * anything in this scheme.
 */
const schemeWithTopConcepts = {
  displayed: {
    _id: 'scheme-1',
    _type: 'skosConceptScheme',
    title: 'Test Scheme',
    topConcepts: [{_key: 'k1', _ref: 'top-1', _type: 'reference'}],
  },
} as unknown as ConceptSchemeDocument

function renderHierarchy(
  port: ReturnType<typeof createFakeDataPort>,
  releaseContext: string | undefined = undefined,
  inputComponent = false,
  schemeDocument: ConceptSchemeDocument = scheme,
) {
  return renderWithUi(
    <TaxonomyPortProvider port={port}>
      <SchemeContext.Provider value={schemeDocument}>
        <ReleaseContext.Provider value={releaseContext}>
          <Hierarchy inputComponent={inputComponent} />
        </ReleaseContext.Provider>
      </SchemeContext.Provider>
    </TaxonomyPortProvider>,
  )
}

/** The publication marker group on a row, or null when the row shows none. */
function markersFor(label: string) {
  const link = screen.getByRole('button', {name: new RegExp(`^${label}`)})
  const row = link.closest('[data-ui="Card"]')
  if (!row) throw new Error(`No row card found for ${label}`)
  return row.querySelector('[role="img"]')
}

/** The glyphs inside that group, in render order. */
function markerGlyphs(label: string) {
  const group = markersFor(label)
  return [...(group?.querySelectorAll('[data-sanity-icon]') ?? [])].map((el) =>
    el.getAttribute('data-sanity-icon'),
  )
}

/** Removing a concept lives in the row's overflow menu, not on the row itself. */
async function removeViaMenu(label: string) {
  const user = userEvent.setup()
  await user.click(rowButton(label, ICON.menu)!)
  await user.click(menuItem(ICON.remove)!)
}

describe('Hierarchy (trunk watch seam)', () => {
  it('watches the trunk tree with the document id and perspective', () => {
    const port = createFakeDataPort({loading: true})
    renderHierarchy(port)

    expect(document.querySelector('[data-ui="Spinner"]')).not.toBeNull()
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

    expect(screen.getByRole('button', {name: /^Animals/})).toBeInTheDocument()
  })

  it('routes a concept removal through the port as a remove plan', async () => {
    const tree: DocumentConcepts = {
      topConcepts: [{id: 'concept-1', prefLabel: 'Animals'}],
      concepts: [],
    }
    const port = createFakeDataPort({tree})
    renderHierarchy(port)

    await removeViaMenu('Animals')

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

    expect(screen.getByRole('button', {name: /^Animals/})).toBeInTheDocument()
    await removeViaMenu('Animals')
    expect(screen.queryByRole('button', {name: /^Animals/})).not.toBeInTheDocument()
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

    expect(screen.getByRole('button', {name: /^Minerals/})).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('button', {name: /^Animals/})).not.toHaveAttribute('aria-current')
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

    const occurrences = screen.getAllByRole('button', {name: /^Carbon/})
    expect(occurrences).toHaveLength(2)
    occurrences.forEach((row) => expect(row).toHaveAttribute('aria-current', 'true'))
  })
})

describe('Hierarchy (publication markers)', () => {
  /** A scheme of one concept, whose `_originalId` says whether a draft exists. */
  function treeOf(originalId: string): DocumentConcepts {
    return {
      topConcepts: [{id: 'concept-1', prefLabel: 'Animals', _originalId: originalId}],
      concepts: [],
    }
  }

  it('shows the draft ring before the published dot for a concept with both', () => {
    const port = createFakeDataPort({
      tree: treeOf('drafts.concept-1'),
      publishedIds: ['concept-1'],
    })
    renderHierarchy(port)

    expect(markersFor('Animals')).toHaveAttribute(
      'aria-label',
      'Published, with unpublished changes',
    )
    expect(markerGlyphs('Animals')).toEqual(['ring', 'circle-small'])
  })

  it('shows the published dot alone for a concept with no draft', () => {
    const port = createFakeDataPort({tree: treeOf('concept-1'), publishedIds: ['concept-1']})
    renderHierarchy(port)

    expect(markersFor('Animals')).toHaveAttribute('aria-label', 'Published')
    expect(markerGlyphs('Animals')).toEqual(['circle-small'])
  })

  it('shows the draft ring alone for a concept that has never been published', () => {
    const port = createFakeDataPort({tree: treeOf('drafts.concept-1'), publishedIds: []})
    renderHierarchy(port)

    expect(markersFor('Animals')).toHaveAttribute('aria-label', 'Not published')
    expect(markerGlyphs('Animals')).toEqual(['ring'])
  })

  it('marks an undrafted concept published without waiting for the query', () => {
    // The drafts perspective returned it and `_originalId` is not a draft, so
    // it is the published document. No query can tell us anything more.
    const port = createFakeDataPort({tree: treeOf('concept-1')})
    renderHierarchy(port)

    expect(markerGlyphs('Animals')).toEqual(['circle-small'])
  })

  it('leaves no row unmarked: a drafted concept shows its ring before the query lands', () => {
    const port = createFakeDataPort({tree: treeOf('drafts.concept-1')})
    renderHierarchy(port)

    expect(markerGlyphs('Animals')).toEqual(['ring'])
  })

  it('draws the markers inside the label button, which carries the hover shading', () => {
    // Studio puts the same dots inside the row item's own background rather
    // than beside it. Outside the button they would sit past the shaded edge.
    const port = createFakeDataPort({
      tree: treeOf('drafts.concept-1'),
      publishedIds: ['concept-1'],
    })
    renderHierarchy(port)

    const label = screen.getByRole('button', {name: /^Animals/})
    expect(label.querySelector('[role="img"]')).not.toBeNull()
  })

  it('lays the label and the markers out in a row, which Button does not do for children', () => {
    // Button applies its own `justify` only to the `text`/`icon` props and puts
    // children in a plain Box, which stacked the dots under the label. jsdom
    // cannot see that, so this pins the structure only — the look is an
    // eyeball check.
    const port = createFakeDataPort({
      tree: treeOf('drafts.concept-1'),
      publishedIds: ['concept-1'],
    })
    renderHierarchy(port)

    expect(markersFor('Animals')?.parentElement).toHaveAttribute('data-ui', 'Flex')
  })

  it('asks only about the drafted concepts, sorted, and not the rest of the tree', () => {
    const port = createFakeDataPort({
      tree: {
        topConcepts: [
          {
            id: 'concept-z',
            prefLabel: 'Zebra',
            _originalId: 'drafts.concept-z',
            childConcepts: [
              {id: 'concept-a', prefLabel: 'Ant', level: 1, _originalId: 'drafts.concept-a'},
              {id: 'concept-m', prefLabel: 'Moth', level: 1, _originalId: 'concept-m'},
            ],
          },
        ],
        concepts: [],
      },
      publishedIds: [],
    })
    renderHierarchy(port)

    // 'concept-m' is already published; only the two drafts are asked about.
    expect(port.lastPublishedParams).toEqual({ids: ['concept-a', 'concept-z']})
  })

  it('asks about nothing, and marks nothing, in a release perspective', () => {
    // `_originalId` is a version id there, not a draft, so every row would
    // otherwise read as unpublished.
    const port = createFakeDataPort({
      tree: treeOf('versions.autumn.concept-1'),
      publishedIds: ['concept-1'],
    })
    renderHierarchy(port, 'autumn')

    expect(port.lastPublishedParams).toEqual({ids: []})
    expect(markersFor('Animals')).toBeNull()
  })

  it('asks about nothing, and marks nothing, in an input tree', () => {
    const port = createFakeDataPort({
      tree: treeOf('drafts.concept-1'),
      publishedIds: ['concept-1'],
    })
    renderHierarchy(port, undefined, true)

    expect(port.lastPublishedParams).toEqual({ids: []})
    expect(markersFor('Animals')).toBeNull()
  })
})

describe('Hierarchy (promote and demote)', () => {
  const ORPHAN: DocumentConcepts = {
    topConcepts: [{id: 'top-1', prefLabel: 'Animals'}],
    concepts: [{id: 'orphan-1', prefLabel: 'Minerals', isOrphan: true}],
  }

  /** Opens a row's overflow menu and leaves it open for inspection. */
  async function openRowMenu(label: string) {
    const user = userEvent.setup()
    await user.click(rowButton(label, ICON.menu)!)
    return user
  }

  it('offers promotion on an orphan, and routes it through the port', async () => {
    const port = createFakeDataPort({tree: ORPHAN})
    renderHierarchy(port)

    const user = await openRowMenu('Minerals')
    await user.click(menuItem(ICON.promote)!)

    expect(port.appliedPlans).toHaveLength(1)
    expect(port.appliedPlans[0]).toMatchObject({
      kind: 'setTopConcept',
      unsetPaths: ['concepts[_ref=="orphan-1"]'],
      appendField: 'topConcepts',
    })
  })

  it('offers demotion on a top concept, and routes it through the port', async () => {
    const port = createFakeDataPort({tree: ORPHAN})
    renderHierarchy(port)

    const user = await openRowMenu('Animals')
    await user.click(menuItem(ICON.demote)!)

    expect(port.appliedPlans[0]).toMatchObject({
      kind: 'setTopConcept',
      unsetPaths: ['topConcepts[_ref=="top-1"]'],
      appendField: 'concepts',
    })
  })

  it('does not offer demotion on an orphan', async () => {
    renderHierarchy(createFakeDataPort({tree: ORPHAN}))
    await openRowMenu('Minerals')

    expect(menuItem(ICON.promote)).not.toBeNull()
    expect(menuItem(ICON.demote)).toBeNull()
  })

  it('does not offer promotion on a top concept', async () => {
    renderHierarchy(createFakeDataPort({tree: ORPHAN}))
    await openRowMenu('Animals')

    expect(menuItem(ICON.demote)).not.toBeNull()
    expect(menuItem(ICON.promote)).toBeNull()
  })

  it('does not offer promotion on a nested child, which has a broader term here', async () => {
    const nested: DocumentConcepts = {
      topConcepts: [
        {
          id: 'top-1',
          prefLabel: 'Animals',
          childConcepts: [{id: 'child-1', prefLabel: 'Carbon', level: 1}],
        },
      ],
      concepts: [],
    }
    renderHierarchy(createFakeDataPort({tree: nested}))
    await openRowMenu('Carbon')

    expect(menuItem(ICON.remove)).not.toBeNull()
    expect(menuItem(ICON.promote)).toBeNull()
  })

  it('moves the row to the top concepts before the listener catches up', async () => {
    // The fake's watch data stays static, standing in for the listener's lag.
    // Without the optimistic transform the row keeps its old place while the
    // toast says the change has landed.
    const port = createFakeDataPort({tree: ORPHAN})
    renderHierarchy(port)

    expect(screen.getByRole('button', {name: /^Minerals/})).not.toHaveTextContent('top concept')

    const user = await openRowMenu('Minerals')
    await user.click(menuItem(ICON.promote)!)

    expect(screen.getByRole('button', {name: /^Minerals/})).toHaveTextContent('top concept')
  })

  it('moves a demoted top concept down to the root concepts immediately', async () => {
    const port = createFakeDataPort({tree: ORPHAN})
    renderHierarchy(port)

    expect(screen.getByRole('button', {name: /^Animals/})).toHaveTextContent('top concept')

    const user = await openRowMenu('Animals')
    await user.click(menuItem(ICON.demote)!)

    expect(screen.getByRole('button', {name: /^Animals/})).not.toHaveTextContent('top concept')
  })

  it('puts promotion above Move to… in the menu', async () => {
    renderHierarchy(createFakeDataPort({tree: ORPHAN}))
    await openRowMenu('Minerals')

    const icons = openMenuItems().map((item) =>
      item.querySelector('[data-sanity-icon]')?.getAttribute('data-sanity-icon'),
    )
    expect(icons).toEqual([ICON.promote, ICON.move, ICON.remove])
  })

  it('offers promotion and move alike in a release', async () => {
    // Promotion patches the scheme and a move patches the concept document,
    // but both reach a release version now, so they share one gate.
    renderHierarchy(createFakeDataPort({tree: ORPHAN}), 'autumn')
    await openRowMenu('Minerals')

    expect(menuItem(ICON.promote)).not.toBeNull()
    expect(menuItem(ICON.move)).not.toBeNull()
  })

  it('offers neither in the published perspective', async () => {
    renderHierarchy(createFakeDataPort({tree: ORPHAN}), 'published')

    expect(rowButton('Minerals', ICON.menu)).toBeNull()
  })
})

describe('Hierarchy (orphan badge)', () => {
  const MIXED: DocumentConcepts = {
    topConcepts: [{id: 'top-1', prefLabel: 'Animals'}],
    concepts: [{id: 'orphan-1', prefLabel: 'Minerals', isOrphan: true}],
  }

  it('badges a root concept as an orphan while the scheme has top concepts', () => {
    renderHierarchy(createFakeDataPort({tree: MIXED}), undefined, false, schemeWithTopConcepts)

    expect(screen.getByRole('button', {name: /^Minerals/})).toHaveTextContent('orphan')
  })

  it('badges the top concept as such', () => {
    renderHierarchy(createFakeDataPort({tree: MIXED}), undefined, false, schemeWithTopConcepts)

    expect(screen.getByRole('button', {name: /^Animals/})).toHaveTextContent('top concept')
  })

  it('drops the orphan badge in a scheme with no top concepts, where it says nothing', () => {
    // Every root concept is simply a concept then — which is why demoting the
    // last top concept is "Demote to Concept" rather than "to Orphan".
    const orphansOnly: DocumentConcepts = {
      topConcepts: [],
      concepts: [{id: 'orphan-1', prefLabel: 'Minerals', isOrphan: true}],
    }
    renderHierarchy(createFakeDataPort({tree: orphansOnly}))

    expect(screen.getByRole('button', {name: /^Minerals/})).not.toHaveTextContent('orphan')
  })

  it('never badges an orphan in an input tree', () => {
    renderHierarchy(createFakeDataPort({tree: MIXED}), undefined, true, schemeWithTopConcepts)

    expect(screen.getByRole('button', {name: /^Minerals/})).not.toHaveTextContent('orphan')
  })

  it('does not badge a nested child, which has a broader term here', () => {
    const nested: DocumentConcepts = {
      topConcepts: [
        {
          id: 'top-1',
          prefLabel: 'Animals',
          childConcepts: [{id: 'child-1', prefLabel: 'Carbon', level: 1}],
        },
      ],
      concepts: [],
    }
    renderHierarchy(createFakeDataPort({tree: nested}), undefined, false, schemeWithTopConcepts)

    const child = screen.getByRole('button', {name: /^Carbon/})
    expect(child).not.toHaveTextContent('orphan')
    expect(child).not.toHaveTextContent('top concept')
  })
})

describe('Hierarchy (insert an existing concept)', () => {
  const TREE: DocumentConcepts = {
    topConcepts: [{id: 'top-1', prefLabel: 'Animals', _originalId: 'top-1'}],
    concepts: [],
  }
  const CANDIDATES = [
    {id: 'outside-1', prefLabel: 'Moths', _originalId: 'outside-1'},
    {id: 'top-1', prefLabel: 'Animals', _originalId: 'top-1'},
  ]

  /**
   * The insert controls, found by their icon rather than by their label.
   * The button has no text, so its accessible name is the tooltip copy — and
   * matching on that makes every one of these tests fail when the wording is
   * edited, which is a product decision rather than a behavior change. The
   * icon is the stable handle, as it is for the caret in TreeStructure.test.
   */
  function insertButtons(): HTMLElement[] {
    return [...document.querySelectorAll(`[data-sanity-icon="${ICON.insert}"]`)]
      .map((icon) => icon.closest('button'))
      .filter((button): button is HTMLButtonElement => button !== null)
  }

  /** The picker's text input, found by role so copy changes cannot break it. */
  function pickerInput() {
    return screen.getByRole('combobox')
  }

  async function openPicker(port: ReturnType<typeof createFakeDataPort>) {
    renderHierarchy(port, undefined, false, schemeWithTopConcepts)
    const user = userEvent.setup()
    await user.click(insertButtons()[0])
    return user
  }

  it('offers the control on a row, beside the add control', () => {
    renderHierarchy(createFakeDataPort({tree: TREE}))

    expect(insertButtons()).toHaveLength(1)
  })

  it('offers it in a release, where both documents now resolve to versions', () => {
    renderHierarchy(createFakeDataPort({tree: TREE}), 'autumn')

    expect(insertButtons()).toHaveLength(1)
  })

  it('withholds it in an input tree', () => {
    renderHierarchy(createFakeDataPort({tree: TREE}), undefined, true)

    expect(insertButtons()).toHaveLength(0)
  })

  it('searches with the scheme’s own members excluded', async () => {
    const port = createFakeDataPort({tree: TREE, searchResults: CANDIDATES})
    const user = await openPicker(port)

    await user.type(pickerInput(), 'mo')

    // The browse search fires on open, so wait for the typed one specifically.
    await waitFor(() => expect(port.lastSearchParams?.searchQuery).toBe('mo*'))
    expect(port.lastSearchParams?.excludeIds).toContain('top-1')
  })

  it('lists what is available before anything is typed, so the menu can be browsed', async () => {
    const port = createFakeDataPort({tree: TREE, searchResults: CANDIDATES})
    const user = await openPicker(port)

    // `*` matches every label, which is what makes the menu a browse list.
    await waitFor(() => expect(port.lastSearchParams?.searchQuery).toBe('*'))
    expect(port.lastSearchParams?.excludeIds).toContain('top-1')

    // The chevron opens the list, and the candidates are already there.
    await user.click(screen.getByRole('button', {name: 'Open'}))
    expect(await screen.findByText('Moths')).toBeInTheDocument()
  })

  it('renders each option as a button, which is what makes it look clickable', async () => {
    // Hover highlight and the pointer cursor come from the option being an
    // interactive element. As a plain Box it looked identical until you tried
    // to click it — no highlight, and the cursor stayed the text I-beam.
    // jsdom has no styling, so this pins the element, not the appearance.
    const port = createFakeDataPort({tree: TREE, searchResults: CANDIDATES})
    const user = await openPicker(port)
    await user.click(await screen.findByRole('button', {name: 'Open'}))

    const option = await screen.findByText('Moths')
    expect(option.closest('button')).not.toBeNull()
  })

  it('routes the chosen concept through the port as an insert plan', async () => {
    const port = createFakeDataPort({tree: TREE, searchResults: CANDIDATES})
    const user = await openPicker(port)

    await user.type(pickerInput(), 'mo')
    // Let the debounced search land first. Clicking before it does picks an
    // option from the browse list that the search is about to replace, and the
    // click lands on a node that is no longer in the document.
    await waitFor(() => expect(port.lastSearchParams?.searchQuery).toBe('mo*'))
    await user.click(await screen.findByText('Moths'))

    await waitFor(() => expect(port.appliedPlans).toHaveLength(1))
    expect(port.appliedPlans[0]).toMatchObject({
      kind: 'insert',
      schemeEdit: {appendField: 'concepts', reference: {_ref: 'outside-1'}},
      conceptEdit: {publishedId: 'outside-1', reference: {_ref: 'top-1'}},
    })
  })

  it('shows the inserted concept before the listener catches up', async () => {
    // The fake's watch data stays static, standing in for the listener's lag.
    const port = createFakeDataPort({tree: TREE, searchResults: CANDIDATES})
    const user = await openPicker(port)

    expect(screen.queryByRole('button', {name: /^Moths/})).not.toBeInTheDocument()

    await user.type(pickerInput(), 'mo')
    // Let the debounced search land first. Clicking before it does picks an
    // option from the browse list that the search is about to replace, and the
    // click lands on a node that is no longer in the document.
    await waitFor(() => expect(port.lastSearchParams?.searchQuery).toBe('mo*'))
    await user.click(await screen.findByText('Moths'))

    expect(await screen.findByRole('button', {name: /^Moths/})).toBeInTheDocument()
  })
})

describe('Hierarchy (insert at the root)', () => {
  const TREE: DocumentConcepts = {
    topConcepts: [{id: 'top-1', prefLabel: 'Animals', _originalId: 'top-1'}],
    concepts: [],
  }
  const OUTSIDER = {id: 'outside-1', prefLabel: 'Moths', _originalId: 'outside-1'}

  /** Both menu items carry the insert icon, so they are told apart by order. */
  const SCHEME_MENU = {topConcept: 0, concept: 1} as const

  async function openSchemeMenu(
    port: ReturnType<typeof createFakeDataPort>,
    item: (typeof SCHEME_MENU)[keyof typeof SCHEME_MENU],
  ) {
    renderHierarchy(port, undefined, false, schemeWithTopConcepts)
    const user = userEvent.setup()
    await user.click(schemeMenuButton())
    await user.click(openMenuItems()[item])
    // The chevron opens the list; focusing no longer does (see the dialog).
    await user.click(await screen.findByRole('button', {name: 'Open'}))
    return user
  }

  it('adds an existing concept as a top concept, through the port', async () => {
    const port = createFakeDataPort({tree: TREE, searchResults: [OUTSIDER]})
    const user = await openSchemeMenu(port, SCHEME_MENU.topConcept)

    await user.click(await screen.findByText('Moths'))

    await waitFor(() => expect(port.appliedPlans).toHaveLength(1))
    expect(port.appliedPlans[0]).toMatchObject({
      kind: 'insertRoot',
      appendField: 'topConcepts',
      reference: {_ref: 'outside-1'},
    })
  })

  it('adds an existing concept to the scheme’s concepts', async () => {
    const port = createFakeDataPort({tree: TREE, searchResults: [OUTSIDER]})
    const user = await openSchemeMenu(port, SCHEME_MENU.concept)

    await user.click(await screen.findByText('Moths'))

    await waitFor(() => expect(port.appliedPlans).toHaveLength(1))
    expect(port.appliedPlans[0]).toMatchObject({kind: 'insertRoot', appendField: 'concepts'})
  })

  it('bars a candidate holding an in-scheme broader term from the top concept picker', async () => {
    // SKOS says a top concept has no broader term inside its own scheme. A
    // broader term in another scheme is no bar, which is why this is a query
    // flag rather than a blanket exclusion.
    const port = createFakeDataPort({tree: TREE, searchResults: [OUTSIDER]})
    await openSchemeMenu(port, SCHEME_MENU.topConcept)

    await waitFor(() => expect(port.lastSearchParams).not.toBeNull())
    expect(port.lastSearchParams?.allowBroaderInScheme).toBe(false)
  })

  it('allows one into the plain concept picker, where it lands under that term', async () => {
    const port = createFakeDataPort({tree: TREE, searchResults: [OUTSIDER]})
    await openSchemeMenu(port, SCHEME_MENU.concept)

    await waitFor(() => expect(port.lastSearchParams).not.toBeNull())
    expect(port.lastSearchParams?.allowBroaderInScheme).toBe(true)
  })

  it('shows a new top concept before the listener catches up', async () => {
    const port = createFakeDataPort({tree: TREE, searchResults: [OUTSIDER]})
    const user = await openSchemeMenu(port, SCHEME_MENU.topConcept)

    await user.click(await screen.findByText('Moths'))

    expect(await screen.findByRole('button', {name: /^Moths/})).toHaveTextContent('top concept')
  })

  it('shows a plain concept under its in-scheme broader term, not at the root', async () => {
    const withBroader = {...OUTSIDER, broaderRefs: ['top-1']}
    const port = createFakeDataPort({tree: TREE, searchResults: [withBroader]})
    const user = await openSchemeMenu(port, SCHEME_MENU.concept)

    await user.click(await screen.findByText('Moths'))

    const row = await screen.findByRole('button', {name: /^Moths/})
    expect(row).not.toHaveTextContent('top concept')
    // Nested: its row sits inside the parent's subtree, not beside it.
    const parentBox = screen.getByRole('button', {name: /^Animals/}).closest('.open')
    expect(parentBox?.contains(row)).toBe(true)
  })
})
