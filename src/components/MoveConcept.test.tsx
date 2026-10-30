import {screen, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {ReleaseContext, SchemeContext} from '../context'
import {TaxonomyPortProvider} from '../seams/TaxonomyPortContext'
import {createFakeDataPort} from '../test/FakeDataPort'
import {renderWithUi} from '../test/renderWithUi'
import type {ConceptSchemeDocument, DocumentConcepts} from '../types'

import {Hierarchy} from './Hierarchy'

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

/**
 * Animals ─┬─ Birds ── Falcons
 *          └─ Mammals
 */
const tree = (): DocumentConcepts => ({
  topConcepts: [
    {
      id: 'animals',
      prefLabel: 'Animals',
      childConcepts: [
        {
          id: 'birds',
          prefLabel: 'Birds',
          level: 1,
          childConcepts: [{id: 'falcons', prefLabel: 'Falcons', level: 2}],
        },
        {id: 'mammals', prefLabel: 'Mammals', level: 1},
      ],
    },
  ],
  concepts: [],
})

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

/** Open the row menu for a concept and choose Move to…, returning the dialog. */
async function openMoveDialog(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.click(screen.getByRole('button', {name: `More actions for ${label}`}))
  await user.click(await screen.findByText('Move to…'))
  return screen.getByRole('dialog')
}

describe('the move command, where it is offered', () => {
  it('offers a move on a nested concept', () => {
    renderHierarchy(createFakeDataPort({tree: tree()}))
    expect(screen.getByRole('button', {name: 'More actions for Falcons'})).toBeInTheDocument()
  })

  it('does not offer one on a top concept, which has no broader term to move from', () => {
    renderHierarchy(createFakeDataPort({tree: tree()}))
    expect(screen.queryByRole('button', {name: 'More actions for Animals'})).not.toBeInTheDocument()
  })

  it('does not offer one in the published perspective', () => {
    renderHierarchy(createFakeDataPort({tree: tree()}), 'published')
    expect(screen.queryByRole('button', {name: 'More actions for Falcons'})).not.toBeInTheDocument()
  })

  it('does not offer one inside a release, which the move path cannot target yet', () => {
    renderHierarchy(createFakeDataPort({tree: tree()}), 'rSummerDrop')
    expect(screen.queryByRole('button', {name: 'More actions for Falcons'})).not.toBeInTheDocument()
  })
})

describe('the move command, choosing a destination', () => {
  it('routes a chosen destination through the port as a move plan', async () => {
    const user = userEvent.setup()
    const port = createFakeDataPort({tree: tree()})
    renderHierarchy(port)

    const dialog = await openMoveDialog(user, 'Falcons')
    await user.click(within(dialog).getByRole('button', {name: /^Mammals/}))

    expect(port.appliedPlans).toHaveLength(1)
    expect(port.appliedPlans[0]).toMatchObject({
      kind: 'move',
      publishedId: 'falcons',
      unsetBroader: 'broader[_ref=="birds"]',
      insertBroader: {_ref: 'mammals', _type: 'reference'},
    })
  })

  it('re-parents the tree optimistically, before the listener catches up', async () => {
    const user = userEvent.setup()
    // The fake's watch data stays static, standing in for the refetch lag, so
    // anything that moves on screen moved because of the optimistic layer.
    renderHierarchy(createFakeDataPort({tree: tree()}))

    const dialog = await openMoveDialog(user, 'Falcons')
    await user.click(within(dialog).getByRole('button', {name: /^Mammals/}))

    const mammalsRow = screen.getByRole('button', {name: /^Mammals/}).closest('.open')
    expect(mammalsRow).toContainElement(screen.getByRole('button', {name: /^Falcons/}))
  })

  it('explains a destination the hierarchy cannot take, and applies nothing', async () => {
    const user = userEvent.setup()
    const port = createFakeDataPort({tree: tree()})
    renderHierarchy(port)

    const dialog = await openMoveDialog(user, 'Falcons')
    // Birds is where Falcons already sits.
    await user.click(within(dialog).getByRole('button', {name: /^Birds/}))

    expect(await within(dialog).findByText('This concept is already here.')).toBeVisible()
    expect(port.appliedPlans).toHaveLength(0)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('refuses a concept dropped onto itself', async () => {
    const user = userEvent.setup()
    const port = createFakeDataPort({tree: tree()})
    renderHierarchy(port)

    const dialog = await openMoveDialog(user, 'Falcons')
    await user.click(within(dialog).getByRole('button', {name: /^Falcons/}))

    expect(
      await within(dialog).findByText('A concept cannot be its own broader term.'),
    ).toBeVisible()
    expect(port.appliedPlans).toHaveLength(0)
  })

  it('drops the broader term when asked, with nothing to insert', async () => {
    const user = userEvent.setup()
    const port = createFakeDataPort({tree: tree()})
    renderHierarchy(port)

    const dialog = await openMoveDialog(user, 'Falcons')
    await user.click(within(dialog).getByRole('button', {name: /as a broader term/}))

    expect(port.appliedPlans[0]).toMatchObject({
      kind: 'move',
      unsetBroader: 'broader[_ref=="birds"]',
      insertBroader: null,
    })
  })
})
