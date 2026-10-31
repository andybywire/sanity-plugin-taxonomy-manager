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
  await user.click(screen.getByRole('button', {name: `More actions for ${label}`}))
  await user.click(await screen.findByText('Remove from scheme'))
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
    await user.click(screen.getByRole('button', {name: `More actions for ${label}`}))
    return user
  }

  it('offers promotion on an orphan, and routes it through the port', async () => {
    const port = createFakeDataPort({tree: ORPHAN})
    renderHierarchy(port)

    const user = await openRowMenu('Minerals')
    await user.click(await screen.findByText('Promote to Top Concept'))

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
    await user.click(await screen.findByText('Demote to Concept'))

    expect(port.appliedPlans[0]).toMatchObject({
      kind: 'setTopConcept',
      unsetPaths: ['topConcepts[_ref=="top-1"]'],
      appendField: 'concepts',
    })
  })

  it('does not offer demotion on an orphan', async () => {
    renderHierarchy(createFakeDataPort({tree: ORPHAN}))
    await openRowMenu('Minerals')

    expect(await screen.findByText('Promote to Top Concept')).toBeInTheDocument()
    expect(screen.queryByText('Demote to Concept')).not.toBeInTheDocument()
  })

  it('does not offer promotion on a top concept', async () => {
    renderHierarchy(createFakeDataPort({tree: ORPHAN}))
    await openRowMenu('Animals')

    expect(await screen.findByText('Demote to Concept')).toBeInTheDocument()
    expect(screen.queryByText('Promote to Top Concept')).not.toBeInTheDocument()
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

    expect(await screen.findByText('Remove from scheme')).toBeInTheDocument()
    expect(screen.queryByText('Promote to Top Concept')).not.toBeInTheDocument()
  })

  it('moves the row to the top concepts before the listener catches up', async () => {
    // The fake's watch data stays static, standing in for the listener's lag.
    // Without the optimistic transform the row keeps its old place while the
    // toast says the change has landed.
    const port = createFakeDataPort({tree: ORPHAN})
    renderHierarchy(port)

    expect(screen.getByRole('button', {name: /^Minerals/})).not.toHaveTextContent('top concept')

    const user = await openRowMenu('Minerals')
    await user.click(await screen.findByText('Promote to Top Concept'))

    expect(screen.getByRole('button', {name: /^Minerals/})).toHaveTextContent('top concept')
  })

  it('moves a demoted top concept down to the root concepts immediately', async () => {
    const port = createFakeDataPort({tree: ORPHAN})
    renderHierarchy(port)

    expect(screen.getByRole('button', {name: /^Animals/})).toHaveTextContent('top concept')

    const user = await openRowMenu('Animals')
    await user.click(await screen.findByText('Demote to Concept'))

    expect(screen.getByRole('button', {name: /^Animals/})).not.toHaveTextContent('top concept')
  })

  it('puts promotion above Move to… in the menu', async () => {
    renderHierarchy(createFakeDataPort({tree: ORPHAN}))
    await openRowMenu('Minerals')

    // @sanity/ui renders menu items as plain buttons, so read them off the menu.
    const menu = document.querySelector('[data-ui="Menu"]')
    const items = [...(menu?.querySelectorAll('button') ?? [])].map((item) => item.textContent)
    expect(items).toEqual(['Promote to Top Concept', 'Move to…', 'Remove from scheme'])
  })

  it('still offers promotion in a release, where Move to… is withheld', async () => {
    // These patch the scheme alone, which the id math already makes
    // release-aware. A move patches the concept document through the Actions
    // API, which has no versionId — hence the narrower gate on that one.
    renderHierarchy(createFakeDataPort({tree: ORPHAN}), 'autumn')
    await openRowMenu('Minerals')

    expect(await screen.findByText('Promote to Top Concept')).toBeInTheDocument()
    expect(screen.queryByText('Move to…')).not.toBeInTheDocument()
  })

  it('offers neither in the published perspective', async () => {
    renderHierarchy(createFakeDataPort({tree: ORPHAN}), 'published')

    expect(
      screen.queryByRole('button', {name: 'More actions for Minerals'}),
    ).not.toBeInTheDocument()
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
