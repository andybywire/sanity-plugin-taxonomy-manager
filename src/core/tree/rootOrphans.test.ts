import {describe, expect, it} from 'vitest'

import type {DocumentConcepts} from '../../types'

import {hasRootOrphans, rootOrphans} from './rootOrphans'

const data = (concepts: DocumentConcepts['concepts']): DocumentConcepts => ({
  topConcepts: [{id: 'animals', prefLabel: 'Animals'}],
  concepts,
})

describe('rootOrphans', () => {
  it('keeps only the members with no broader term inside the scheme', () => {
    const tree = data([
      {id: 'unfiled', prefLabel: 'Unfiled', isOrphan: true},
      {id: 'birds', prefLabel: 'Birds', isOrphan: false},
      {id: 'strays', prefLabel: 'Strays', isOrphan: true},
    ])
    expect(rootOrphans(tree).map((c) => c.id)).toEqual(['unfiled', 'strays'])
  })

  it('returns nothing for a scheme with no members and for no tree at all', () => {
    expect(rootOrphans(data([]))).toEqual([])
    expect(rootOrphans(null)).toEqual([])
  })
})

describe('hasRootOrphans', () => {
  it('is true when something at the root is not a top concept', () => {
    expect(hasRootOrphans(data([{id: 'unfiled', prefLabel: 'Unfiled', isOrphan: true}]))).toBe(true)
  })

  it('is false when every member already hangs under a broader term', () => {
    expect(hasRootOrphans(data([{id: 'birds', prefLabel: 'Birds', isOrphan: false}]))).toBe(false)
  })

  it('is false for an empty scheme and for no tree at all', () => {
    expect(hasRootOrphans(data([]))).toBe(false)
    expect(hasRootOrphans(null)).toBe(false)
  })
})
