import {describe, expect, it} from 'vitest'

import type {DocumentConcepts} from '../../types'

import {
  insertConceptInTree,
  insertRootConceptInTree,
  isInsertApplied,
  isRootInsertApplied,
} from './insertConcept'

const tree = (): DocumentConcepts => ({
  topConcepts: [
    {
      id: 'top-1',
      prefLabel: 'Animals',
      childConcepts: [
        {id: 'child-a', prefLabel: 'Ants', level: 1},
        {id: 'child-z', prefLabel: 'Zebras', level: 1},
      ],
    },
  ],
  concepts: [{id: 'orphan-1', prefLabel: 'Minerals', isOrphan: true, level: 0}],
})

const insert = {conceptId: 'new-1', prefLabel: 'Moths', parentId: 'top-1'}

describe('insertConceptInTree', () => {
  it('adds the concept under its new parent, in alphabetical position', () => {
    const next = insertConceptInTree(tree(), insert)

    expect(next?.topConcepts[0].childConcepts?.map((child) => child.prefLabel)).toEqual([
      'Ants',
      'Moths',
      'Zebras',
    ])
  })

  it('levels the inserted concept one below its parent', () => {
    const next = insertConceptInTree(tree(), insert)
    const added = next?.topConcepts[0].childConcepts?.find((child) => child.id === 'new-1')

    expect(added).toMatchObject({id: 'new-1', prefLabel: 'Moths', level: 1})
  })

  it('inserts under an orphan at the root too', () => {
    const next = insertConceptInTree(tree(), {...insert, parentId: 'orphan-1'})

    expect(next?.concepts[0].childConcepts).toMatchObject([{id: 'new-1', level: 1}])
  })

  it('inserts under a nested concept, levelled from that depth', () => {
    const next = insertConceptInTree(tree(), {...insert, parentId: 'child-a'})
    const added = next?.topConcepts[0].childConcepts?.[0].childConcepts?.[0]

    expect(added).toMatchObject({id: 'new-1', level: 2})
  })

  it('leaves the tree alone when the parent is not in it', () => {
    const data = tree()
    expect(insertConceptInTree(data, {...insert, parentId: 'nowhere'})).toBe(data)
  })

  it('leaves the tree alone when the concept is already under that parent', () => {
    const data = tree()
    expect(insertConceptInTree(data, {...insert, conceptId: 'child-a'})).toBe(data)
  })

  it('returns null for no tree', () => {
    expect(insertConceptInTree(null, insert)).toBeNull()
  })

  it('never mutates the tree it is given', () => {
    const data = tree()
    const before = JSON.stringify(data)

    insertConceptInTree(data, insert)

    expect(JSON.stringify(data)).toBe(before)
  })
})

describe('isInsertApplied', () => {
  it('sees the insert once the concept is a child of that parent', () => {
    const next = insertConceptInTree(tree(), insert)
    expect(isInsertApplied(next, insert)).toBe(true)
  })

  it('is false while the concept is not there yet', () => {
    expect(isInsertApplied(tree(), insert)).toBe(false)
  })

  it('is false with no tree, so a pending insert is never dropped early', () => {
    expect(isInsertApplied(null, insert)).toBe(false)
  })
})

describe('insertRootConceptInTree', () => {
  const asTop = {conceptId: 'new-1', prefLabel: 'Minerals', asTopConcept: true}
  const asPlain = {...asTop, asTopConcept: false}

  it('adds a top concept among the top concepts, in alphabetical position', () => {
    const next = insertRootConceptInTree(tree(), asTop)

    expect(next?.topConcepts.map((node) => node.prefLabel)).toEqual(['Animals', 'Minerals'])
  })

  it('adds a plain concept among the concepts, marked as an orphan so it sits at the root', () => {
    const next = insertRootConceptInTree(tree(), {...asPlain, prefLabel: 'Alloys'})

    expect(next?.concepts.map((node) => node.prefLabel)).toEqual(['Alloys', 'Minerals'])
    expect(next?.concepts[0]).toMatchObject({isOrphan: true, level: 0})
  })

  it('leaves the tree alone once the concept is already there', () => {
    const next = insertRootConceptInTree(tree(), asTop)
    expect(insertRootConceptInTree(next, asTop)).toBe(next)
  })

  it('returns null for no tree', () => {
    expect(insertRootConceptInTree(null, asTop)).toBeNull()
  })

  it('never mutates the tree it is given', () => {
    const data = tree()
    const before = JSON.stringify(data)

    insertRootConceptInTree(data, asTop)

    expect(JSON.stringify(data)).toBe(before)
  })
})

describe('isRootInsertApplied', () => {
  it('watches the list the concept is joining, not the other one', () => {
    const data = tree()
    expect(
      isRootInsertApplied(data, {conceptId: 'top-1', prefLabel: 'x', asTopConcept: true}),
    ).toBe(true)
    expect(
      isRootInsertApplied(data, {conceptId: 'top-1', prefLabel: 'x', asTopConcept: false}),
    ).toBe(false)
  })

  it('is false with no tree, so a pending insert is never dropped early', () => {
    expect(
      isRootInsertApplied(null, {conceptId: 'top-1', prefLabel: 'x', asTopConcept: true}),
    ).toBe(false)
  })
})
