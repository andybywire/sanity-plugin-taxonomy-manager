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
      port.useWatchTree({mode: 'trunk', documentId: 's', perspective: undefined})
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
      recommendations: [{score: 0.9, value: {documentId: 'd1', type: 'skosConcept'}}],
    })

    const {result} = renderHook(() => port.useSemanticRecommendations())
    expect(result.current.conceptRecs).toHaveLength(1)
    expect(result.current.recsError).toBeNull()

    result.current.triggerEmbeddingsSearch()
    expect(port.triggeredSearches).toBe(1)
  })
})
