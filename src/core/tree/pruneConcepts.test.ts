import {describe, expect, it} from 'vitest'

import type {DocumentConcepts} from '../../types'

import {collectConceptIds, pruneConcepts} from './pruneConcepts'

const tree = (): DocumentConcepts => ({
  topConcepts: [
    {
      id: 'top-1',
      prefLabel: 'Top 1',
      childConcepts: [
        {id: 'child-1', prefLabel: 'Child 1', level: 1},
        {
          id: 'child-2',
          prefLabel: 'Child 2',
          level: 1,
          childConcepts: [{id: 'grandchild-1', prefLabel: 'Grandchild 1', level: 2}],
        },
      ],
    },
    {id: 'top-2', prefLabel: 'Top 2'},
  ],
  concepts: [{id: 'orphan-1', prefLabel: 'Orphan 1', isOrphan: true}],
})

describe('pruneConcepts', () => {
  it('returns the same reference when nothing is removed', () => {
    const data = tree()
    expect(pruneConcepts(data, new Set())).toBe(data)
  })

  it('passes null through', () => {
    expect(pruneConcepts(null, new Set(['top-1']))).toBeNull()
  })

  it('removes a top concept (and its subtree) by id', () => {
    const result = pruneConcepts(tree(), new Set(['top-1']))
    expect(result?.topConcepts.map((c) => c.id)).toEqual(['top-2'])
    expect(result?.concepts.map((c) => c.id)).toEqual(['orphan-1'])
  })

  it('removes a nested child without touching its siblings', () => {
    const result = pruneConcepts(tree(), new Set(['child-1']))
    expect(result?.topConcepts[0].childConcepts?.map((c) => c.id)).toEqual(['child-2'])
  })

  it('removes a deeply nested grandchild', () => {
    const result = pruneConcepts(tree(), new Set(['grandchild-1']))
    const child2 = result?.topConcepts[0].childConcepts?.find((c) => c.id === 'child-2')
    expect(child2?.childConcepts).toEqual([])
  })

  it('removes an orphan concept', () => {
    const result = pruneConcepts(tree(), new Set(['orphan-1']))
    expect(result?.concepts).toEqual([])
  })

  it('does not mutate the input', () => {
    const data = tree()
    pruneConcepts(data, new Set(['child-1', 'orphan-1']))
    expect(data.topConcepts[0].childConcepts?.map((c) => c.id)).toEqual(['child-1', 'child-2'])
    expect(data.concepts.map((c) => c.id)).toEqual(['orphan-1'])
  })
})

describe('collectConceptIds', () => {
  it('collects every id across top, orphan, and nested children', () => {
    expect(collectConceptIds(tree())).toEqual(
      new Set(['top-1', 'child-1', 'child-2', 'grandchild-1', 'top-2', 'orphan-1'])
    )
  })

  it('returns an empty set for null', () => {
    expect(collectConceptIds(null)).toEqual(new Set())
  })
})
