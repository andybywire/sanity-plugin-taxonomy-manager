import {screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {renderWithUi} from '../../test/renderWithUi'
import type {ChildConceptTerm} from '../../types'

import {ConceptDetailLink} from './ConceptDetailLink'

// The link reads Studio's pane router to know which concept is open beside the
// tree. jsdom has no pane router, so stub it and drive the pane state per test.
const mocks = vi.hoisted(() => ({usePaneRouter: vi.fn()}))

vi.mock('sanity/structure', () => ({usePaneRouter: mocks.usePaneRouter}))

const concept = (over: Partial<ChildConceptTerm> = {}): ChildConceptTerm => ({
  id: 'concept-1',
  prefLabel: 'Mathematics',
  ...over,
})

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

describe('ConceptDetailLink (current-concept marking)', () => {
  it('marks the concept open in the pane to the right as current', () => {
    mocks.usePaneRouter.mockReturnValue(panes('concept-1'))
    renderWithUi(<ConceptDetailLink concept={concept()} />)

    expect(screen.getByRole('button', {name: /Mathematics/})).toHaveAttribute(
      'aria-current',
      'true',
    )
  })

  it('leaves a concept that is not open unmarked', () => {
    mocks.usePaneRouter.mockReturnValue(panes('concept-2'))
    renderWithUi(<ConceptDetailLink concept={concept()} />)

    expect(screen.getByRole('button', {name: /Mathematics/})).not.toHaveAttribute('aria-current')
  })

  it('leaves every concept unmarked when no concept pane is open', () => {
    renderWithUi(<ConceptDetailLink concept={concept()} />)

    expect(screen.getByRole('button', {name: /Mathematics/})).not.toHaveAttribute('aria-current')
  })

  // The create-a-concept path opens `drafts.<uuid>` while the tree's node ids
  // come back published — the newly created concept only matches once both
  // sides are normalized.
  it('marks a concept opened as a draft in the pane to the right', () => {
    mocks.usePaneRouter.mockReturnValue(panes('drafts.concept-1'))
    renderWithUi(<ConceptDetailLink concept={concept()} />)

    expect(screen.getByRole('button', {name: /Mathematics/})).toHaveAttribute(
      'aria-current',
      'true',
    )
  })

  it('does not mark the active concept in the input tree', () => {
    mocks.usePaneRouter.mockReturnValue(panes('concept-1'))
    renderWithUi(<ConceptDetailLink concept={concept()} inputComponent />)

    expect(screen.getByRole('button', {name: /Mathematics/})).not.toHaveAttribute('aria-current')
  })
})
