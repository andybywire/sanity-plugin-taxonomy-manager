import {renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import type {ConceptTreeParams} from '../core/ports'

// The adapter's watch members are thin wrappers over `useListeningQuery`.
// Stubbed here so the arguments it is given can be asserted without a Studio.
const mocks = vi.hoisted(() => ({useListeningQuery: vi.fn()}))

vi.mock('sanity-plugin-utils', () => ({useListeningQuery: mocks.useListeningQuery}))
vi.mock('sanity', () => ({useClient: () => ({})}))

import {studioDataAdapter} from './StudioDataAdapter'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.useListeningQuery.mockReturnValue({data: null, loading: false, error: null})
})

/** Every query object handed to `useListeningQuery`, in call order. */
function queryArgs() {
  return mocks.useListeningQuery.mock.calls.map((call) => call[0])
}

describe('StudioDataAdapter — listener stability', () => {
  // `useListeningQuery` keys its subscription effect on the identity of the
  // query object. A new object per render tore the listener down and rebuilt it
  // every time, which drops whatever refetch that subscription had pending — so
  // a mutation's own re-render could race the refetch it had just triggered and
  // leave the tree stale until the view was reloaded.

  it('hands the trunk watch the same query object on every render', () => {
    const params: ConceptTreeParams = {
      mode: 'trunk',
      documentId: 'scheme-1',
      perspective: undefined,
    }
    const {rerender} = renderHook(() => studioDataAdapter.useWatchTree(params))
    rerender()
    rerender()

    const queries = queryArgs()
    expect(queries.length).toBeGreaterThanOrEqual(3)
    queries.forEach((query) => expect(query).toBe(queries[0]))
  })

  it('hands the input watch the same query object on every render', () => {
    const params: ConceptTreeParams = {
      mode: 'input',
      documentId: 'scheme-1',
      branchId: null,
      perspective: undefined,
    }
    const {rerender} = renderHook(() => studioDataAdapter.useWatchTree(params))
    rerender()

    const queries = queryArgs()
    expect(queries.length).toBeGreaterThanOrEqual(2)
    queries.forEach((query) => expect(query).toBe(queries[0]))
  })

  it('gives the trunk and input watches different queries', () => {
    renderHook(() =>
      studioDataAdapter.useWatchTree({
        mode: 'trunk',
        documentId: 's',
        perspective: undefined,
      }),
    )
    renderHook(() =>
      studioDataAdapter.useWatchTree({
        mode: 'input',
        documentId: 's',
        branchId: null,
        perspective: undefined,
      }),
    )

    const [trunk, input] = queryArgs()
    expect(trunk).not.toBe(input)
    expect(trunk.listen).toContain('skosConceptScheme')
    expect(input.listen).toContain('$id')
  })

  it('hands the published-concepts watch the same query object on every render', () => {
    const {rerender} = renderHook(() =>
      studioDataAdapter.useWatchPublishedConcepts({ids: ['a', 'b']}),
    )
    rerender()

    const queries = queryArgs()
    expect(queries.length).toBeGreaterThanOrEqual(2)
    queries.forEach((query) => expect(query).toBe(queries[0]))
  })
})
