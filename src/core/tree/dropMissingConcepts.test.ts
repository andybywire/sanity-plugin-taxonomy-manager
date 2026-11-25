import {describe, expect, it} from 'vitest'

import type {DocumentConcepts} from '../../types'

import {dropMissingConcepts} from './dropMissingConcepts'

/**
 * The shape the trunk query returns for a scheme holding a reference to a
 * deleted concept: `concepts[]->` keeps a `null` where the document used to be.
 * Typed through `unknown` because `DocumentConcepts` promises nodes, which is
 * exactly the promise the Content Lake breaks here.
 */
function treeWithHole(): DocumentConcepts {
  return {
    topConcepts: [null, {id: 'top-1', prefLabel: 'Animals'}],
    concepts: [null, {id: 'orphan-1', prefLabel: 'Rocks', isOrphan: true}],
  } as unknown as DocumentConcepts
}

describe('dropMissingConcepts', () => {
  it('passes null through', () => {
    expect(dropMissingConcepts(null)).toBeNull()
  })

  it('returns the same tree when every reference resolved', () => {
    const tree: DocumentConcepts = {
      topConcepts: [{id: 'top-1', prefLabel: 'Animals'}],
      concepts: [{id: 'orphan-1', prefLabel: 'Rocks'}],
    }

    // Identity, not equality: the tree is a `useMemo` dependency all the way
    // down, and a fresh object on every listener tick would recompute the lot.
    expect(dropMissingConcepts(tree)).toBe(tree)
  })

  it('drops a deleted top concept and keeps the rest in order', () => {
    const result = dropMissingConcepts(treeWithHole())

    expect(result?.topConcepts).toEqual([{id: 'top-1', prefLabel: 'Animals'}])
  })

  it('drops a deleted concept and keeps the rest in order', () => {
    const result = dropMissingConcepts(treeWithHole())

    expect(result?.concepts).toEqual([{id: 'orphan-1', prefLabel: 'Rocks', isOrphan: true}])
  })

  it('does not mutate the tree it was given', () => {
    const tree = treeWithHole()
    dropMissingConcepts(tree)

    expect(tree.topConcepts).toHaveLength(2)
    expect(tree.concepts).toHaveLength(2)
  })

  it('leaves the surviving nodes themselves untouched', () => {
    const survivor = {id: 'top-1', prefLabel: 'Animals', childConcepts: [{id: 'c', prefLabel: 'C'}]}
    const tree = {topConcepts: [null, survivor], concepts: []} as unknown as DocumentConcepts

    // Children come from a `*[…]` filter, which cannot produce a null, so
    // there is nothing to rebuild below the root and the node passes through.
    expect(dropMissingConcepts(tree)?.topConcepts[0]).toBe(survivor)
  })

  it('tolerates a scheme with no top concepts at all', () => {
    // `topConcepts[]->` on a scheme without the field returns null, not [].
    const tree = {topConcepts: null, concepts: [null]} as unknown as DocumentConcepts
    const result = dropMissingConcepts(tree)

    expect(result?.topConcepts ?? null).toBeNull()
    expect(result?.concepts).toEqual([])
  })
})
