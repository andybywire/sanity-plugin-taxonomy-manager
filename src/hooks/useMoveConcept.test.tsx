import {renderHook, waitFor} from '@testing-library/react'
import type {ReactNode} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {OptimisticTreeContext} from '../context'
import type {ConceptMove} from '../core/tree/moveConcept'
import {TaxonomyPortProvider} from '../seams/TaxonomyPortContext'
import {createFakeDataPort} from '../test/FakeDataPort'
import {UiProviders} from '../test/renderWithUi'
import type {ConceptSchemeDocument} from '../types'

import {useMoveConcept} from './useMoveConcept'

const scheme = {
  displayed: {_id: 'scheme-1', _type: 'skosConceptScheme', title: 'Test Scheme'},
} as unknown as ConceptSchemeDocument

const falcons = {id: 'falcons', prefLabel: 'Falcons'}
const birds = {id: 'birds', prefLabel: 'Birds'}
const mammals = {id: 'mammals', prefLabel: 'Mammals', _originalId: 'mammals'}

const optimistic = () => ({
  markRemoved: vi.fn(),
  unmarkRemoved: vi.fn(),
  markMoved: vi.fn(),
  unmarkMoved: vi.fn(),
  markTopConcept: vi.fn(),
  unmarkTopConcept: vi.fn(),
  markInserted: vi.fn(),
  unmarkInserted: vi.fn(),
  markRootInserted: vi.fn(),
  unmarkRootInserted: vi.fn(),
})

function renderMoveConcept(
  port: ReturnType<typeof createFakeDataPort>,
  tracker: ReturnType<typeof optimistic>,
) {
  return renderHook(() => useMoveConcept(scheme), {
    wrapper: ({children}: {children: ReactNode}) => (
      <UiProviders>
        <TaxonomyPortProvider port={port}>
          <OptimisticTreeContext.Provider value={tracker}>
            {children}
          </OptimisticTreeContext.Provider>
        </TaxonomyPortProvider>
      </UiProviders>
    ),
  })
}

beforeEach(() => vi.clearAllMocks())

describe('useMoveConcept', () => {
  it('routes a re-parent through the port as a move plan', () => {
    const port = createFakeDataPort()
    const {result} = renderMoveConcept(port, optimistic())

    result.current(falcons, birds, mammals)

    expect(port.appliedPlans).toHaveLength(1)
    expect(port.appliedPlans[0]).toMatchObject({
      kind: 'move',
      concept: {publishedId: 'falcons', targetId: 'drafts.falcons'},
      unsetBroader: 'broader[_ref=="birds"]',
      insertBroader: {_ref: 'mammals', _type: 'reference'},
    })
  })

  it('routes a dropped broader term through the port with nothing to insert', () => {
    const port = createFakeDataPort()
    const {result} = renderMoveConcept(port, optimistic())

    result.current(falcons, birds, null)

    expect(port.appliedPlans[0]).toMatchObject({
      kind: 'move',
      unsetBroader: 'broader[_ref=="birds"]',
      insertBroader: null,
    })
  })

  it('generates a reference key for the new broader term', () => {
    const port = createFakeDataPort()
    const {result} = renderMoveConcept(port, optimistic())

    result.current(falcons, birds, mammals)

    const plan = port.appliedPlans[0] as {insertBroader: {_key: string}}
    expect(plan.insertBroader._key).toEqual(expect.any(String))
    expect(plan.insertBroader._key.length).toBeGreaterThan(0)
  })

  it('marks the move optimistically before the mutation resolves', () => {
    const tracker = optimistic()
    const {result} = renderMoveConcept(createFakeDataPort(), tracker)

    result.current(falcons, birds, mammals)

    const expected: ConceptMove = {
      conceptId: 'falcons',
      fromParentId: 'birds',
      toParentId: 'mammals',
    }
    expect(tracker.markMoved).toHaveBeenCalledWith(expected)
    expect(tracker.unmarkMoved).not.toHaveBeenCalled()
  })

  it('rolls the optimistic move back when the mutation fails', async () => {
    const port = createFakeDataPort()
    port.useApplyConceptPlan = () => () => Promise.reject(new Error('nope'))
    const tracker = optimistic()
    const {result} = renderMoveConcept(port, tracker)

    result.current(falcons, birds, mammals)

    await waitFor(() =>
      expect(tracker.unmarkMoved).toHaveBeenCalledWith({
        conceptId: 'falcons',
        fromParentId: 'birds',
        toParentId: 'mammals',
      }),
    )
  })

  it('records the destination as null when the broader term is dropped', () => {
    const tracker = optimistic()
    const {result} = renderMoveConcept(createFakeDataPort(), tracker)

    result.current(falcons, birds, null)

    expect(tracker.markMoved).toHaveBeenCalledWith({
      conceptId: 'falcons',
      fromParentId: 'birds',
      toParentId: null,
    })
  })
})
