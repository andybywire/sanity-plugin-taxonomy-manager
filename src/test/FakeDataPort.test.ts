import {renderHook} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {planCreateConcept} from '../core/mutations'
import type {ConceptSchemeDocument, DocumentConcepts} from '../types'

import {createFakeDataPort} from './FakeDataPort'

const scheme = {_id: 'scheme-1', _type: 'skosConceptScheme'} as ConceptSchemeDocument['displayed']
const TREE: DocumentConcepts = {topConcepts: [], concepts: []}

describe('createFakeDataPort', () => {
  it('useWatchTree returns the configured fixture synchronously and records params', () => {
    const port = createFakeDataPort({tree: TREE})
    const params = {mode: 'trunk', documentId: 'scheme-1', perspective: undefined} as const

    const {result} = renderHook(() => port.useWatchTree(params))

    expect(result.current).toEqual({data: TREE, loading: false, error: null})
    expect(port.lastWatchParams).toEqual(params)
  })

  it('defaults to a null, non-loading, error-free result', () => {
    const port = createFakeDataPort()
    const {result} = renderHook(() =>
      port.useWatchTree({mode: 'trunk', documentId: 's', perspective: undefined}),
    )
    expect(result.current).toEqual({data: null, loading: false, error: null})
  })

  it('useApplyConceptPlan records each plan it is given, in order', async () => {
    const port = createFakeDataPort()
    const plan = planCreateConcept({
      scheme,
      conceptType: 'topConcept',
      newConceptUuid: 'u',
      conceptId: 'abc123',
      schemeBaseIri: undefined,
      newConceptKey: 'k',
      broaderKey: 'b',
    })

    const {result} = renderHook(() => port.useApplyConceptPlan())
    await result.current(plan)

    expect(port.appliedPlans).toEqual([plan])
  })

  it('useSemanticRecommendations returns configured recs and counts search triggers', () => {
    const port = createFakeDataPort({
      recommendations: [{conceptId: 'd1', score: 0.9}],
    })

    const {result} = renderHook(() => port.useSemanticRecommendations())
    expect(result.current.conceptRecs).toHaveLength(1)
    expect(result.current.recsError).toBeNull()

    result.current.triggerSearch('scheme-7')
    expect(port.triggeredSearches).toBe(1)
    expect(port.lastSearchSchemeId).toBe('scheme-7')
  })

  it('useWatchPublishedConcepts returns the configured ids as a set and records params', () => {
    const port = createFakeDataPort({publishedIds: ['concept-1', 'concept-2']})
    const params = {ids: ['concept-1', 'concept-2', 'concept-3']}

    const {result} = renderHook(() => port.useWatchPublishedConcepts(params))

    expect(result.current.data).toEqual(new Set(['concept-1', 'concept-2']))
    expect(port.lastPublishedParams).toEqual(params)
  })

  it('reports published ids as null until configured, standing in for a query in flight', () => {
    const port = createFakeDataPort()
    const {result} = renderHook(() => port.useWatchPublishedConcepts({ids: []}))

    expect(result.current.data).toBeNull()
  })
})

describe('createFakeDataPort — concept usage', () => {
  it('useWatchConceptUsage returns the configured counts as a map and records params', () => {
    const port = createFakeDataPort({usage: {a: 19, b: 0}})
    const {result} = renderHook(() =>
      port.useWatchConceptUsage({ids: ['a', 'b'], perspective: undefined}),
    )

    expect(result.current.data?.get('a')).toBe(19)
    expect(result.current.data?.get('b')).toBe(0)
    expect(port.lastUsageParams).toEqual({ids: ['a', 'b'], perspective: undefined})
  })

  it('reports usage as null until configured, standing in for a query in flight', () => {
    const port = createFakeDataPort()
    const {result} = renderHook(() =>
      port.useWatchConceptUsage({ids: ['a'], perspective: undefined}),
    )

    expect(result.current.data).toBeNull()
  })

  it('records the perspective it was asked under', () => {
    const port = createFakeDataPort({usage: {}})
    renderHook(() => port.useWatchConceptUsage({ids: [], perspective: 'rMyRelease'}))

    expect(port.lastUsageParams?.perspective).toBe('rMyRelease')
  })
})
