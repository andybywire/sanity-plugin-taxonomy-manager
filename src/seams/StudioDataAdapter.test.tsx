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

describe('StudioDataAdapter — concept usage', () => {
  it('hands the usage watch the same query object on every render', () => {
    const {rerender} = renderHook(() =>
      studioDataAdapter.useWatchConceptUsage({ids: ['a', 'b'], perspective: undefined}),
    )
    rerender()

    const queries = queryArgs()
    expect(queries.length).toBeGreaterThanOrEqual(2)
    queries.forEach((query) => expect(query).toBe(queries[0]))
  })

  // The count beside a tree row has to be counting the world that row came
  // from, so the perspective is the tree's, mapped exactly as the tree maps it.
  it('follows the perspective it is given, as the tree does', () => {
    renderHook(() => studioDataAdapter.useWatchConceptUsage({ids: ['a'], perspective: undefined}))
    expect(mocks.useListeningQuery.mock.calls[0][1].options.perspective).toBe('drafts')

    vi.clearAllMocks()
    mocks.useListeningQuery.mockReturnValue({data: null, loading: false, error: null})
    renderHook(() =>
      studioDataAdapter.useWatchConceptUsage({ids: ['a'], perspective: 'rMyRelease'}),
    )
    expect(mocks.useListeningQuery.mock.calls[0][1].options.perspective).toEqual(['rMyRelease'])
  })

  it('passes the ids through as a query parameter', () => {
    renderHook(() =>
      studioDataAdapter.useWatchConceptUsage({ids: ['a', 'b'], perspective: undefined}),
    )
    expect(mocks.useListeningQuery.mock.calls[0][1].params).toEqual({ids: ['a', 'b']})
  })

  it('turns the projected rows into a map of id to count', () => {
    mocks.useListeningQuery.mockReturnValue({
      data: [
        {id: 'a', uses: 19},
        {id: 'b', uses: 0},
      ],
      loading: false,
      error: null,
    })
    const {result} = renderHook(() =>
      studioDataAdapter.useWatchConceptUsage({ids: ['a', 'b'], perspective: undefined}),
    )
    expect(result.current.data?.get('a')).toBe(19)
    expect(result.current.data?.get('b')).toBe(0)
  })

  // A row reads this on every pass, so a fresh Map per render would make every
  // consumer of it re-render for nothing.
  it('builds a new map per result, not per render', () => {
    mocks.useListeningQuery.mockReturnValue({
      data: [{id: 'a', uses: 1}],
      loading: false,
      error: null,
    })
    const {result, rerender} = renderHook(() =>
      studioDataAdapter.useWatchConceptUsage({ids: ['a'], perspective: undefined}),
    )
    const first = result.current.data
    rerender()
    expect(result.current.data).toBe(first)
  })

  it('reports null until the query lands, rather than an empty map', () => {
    const {result} = renderHook(() =>
      studioDataAdapter.useWatchConceptUsage({ids: ['a'], perspective: undefined}),
    )
    expect(result.current.data).toBeNull()
  })
})

describe('StudioDataAdapter — the tree cache', () => {
  // Distinct scheme ids per test: the cache is module-level by design, so
  // sharing one would let these leak into each other.
  const TREE = {topConcepts: [{id: 'a', prefLabel: 'Anthropology'}], concepts: []}

  function mountTrunk(documentId: string, perspective?: string) {
    return renderHook(() =>
      studioDataAdapter.useWatchTree({mode: 'trunk', documentId, perspective}),
    )
  }

  /** The `initialValue` handed to the most recent `useListeningQuery` call. */
  function lastInitialValue() {
    const calls = mocks.useListeningQuery.mock.calls
    return calls[calls.length - 1][1].initialValue
  }

  it('hands a remount the tree it last saw, instead of starting from nothing', () => {
    mocks.useListeningQuery.mockReturnValue({data: TREE, loading: false, error: null})
    mountTrunk('scheme-cache-1').unmount()

    mocks.useListeningQuery.mockReturnValue({data: null, loading: true, error: null})
    mountTrunk('scheme-cache-1')

    expect(lastInitialValue()).toEqual(TREE)
  })

  it('starts a scheme it has not seen from nothing', () => {
    mocks.useListeningQuery.mockReturnValue({data: TREE, loading: false, error: null})
    mountTrunk('scheme-cache-2').unmount()

    mountTrunk('scheme-cache-3')

    expect(lastInitialValue()).toBeNull()
  })

  // A release and the drafts view are different trees. Handing one the other's
  // would show an editor content that does not exist in the perspective they
  // selected — the class of bug ADR 0005 was written about.
  it('never hands one perspective another perspective’s tree', () => {
    mocks.useListeningQuery.mockReturnValue({data: TREE, loading: false, error: null})
    mountTrunk('scheme-cache-4', undefined).unmount()

    mountTrunk('scheme-cache-4', 'rMyRelease')

    expect(lastInitialValue()).toBeNull()
  })
})
