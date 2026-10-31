import {describe, expect, it} from 'vitest'

import type {DocumentConcepts} from '../../types'

import {isTopConceptApplied, setTopConceptInTree} from './setTopConcept'

const tree = (): DocumentConcepts => ({
  topConcepts: [
    {id: 'top-a', prefLabel: 'Animals'},
    {id: 'top-m', prefLabel: 'Minerals'},
  ],
  concepts: [
    {id: 'orphan-c', prefLabel: 'Carbon', isOrphan: true, level: 0},
    {id: 'child-z', prefLabel: 'Zebra', isOrphan: false, level: 0},
  ],
})

describe('setTopConceptInTree — promotion', () => {
  it('moves an orphan into the top concepts, in alphabetical position', () => {
    const next = setTopConceptInTree(tree(), {conceptId: 'orphan-c', isTopConcept: true})

    expect(next?.topConcepts.map((concept) => concept.prefLabel)).toEqual([
      'Animals',
      'Carbon',
      'Minerals',
    ])
    expect(next?.concepts.map((concept) => concept.id)).toEqual(['child-z'])
  })

  it('carries the promoted concept’s children with it', () => {
    const data = tree()
    data.concepts[0].childConcepts = [{id: 'kid-1', prefLabel: 'Graphite', level: 1}]

    const next = setTopConceptInTree(data, {conceptId: 'orphan-c', isTopConcept: true})

    expect(next?.topConcepts.find((concept) => concept.id === 'orphan-c')?.childConcepts).toEqual([
      {id: 'kid-1', prefLabel: 'Graphite', level: 1},
    ])
  })

  it('leaves a concept that is not a root orphan alone', () => {
    // 'child-z' is a scheme member rendered under a broader term, not at the
    // root, so there is nothing at the root to promote.
    const data = tree()
    expect(setTopConceptInTree(data, {conceptId: 'child-z', isTopConcept: true})).toBe(data)
  })
})

describe('setTopConceptInTree — demotion', () => {
  it('moves a top concept into the concepts, flagged as an orphan', () => {
    const next = setTopConceptInTree(tree(), {conceptId: 'top-a', isTopConcept: false})

    expect(next?.topConcepts.map((concept) => concept.id)).toEqual(['top-m'])
    expect(next?.concepts.find((concept) => concept.id === 'top-a')).toMatchObject({
      prefLabel: 'Animals',
      isOrphan: true,
      level: 0,
    })
  })

  it('inserts the demoted concept in alphabetical position among the concepts', () => {
    const next = setTopConceptInTree(tree(), {conceptId: 'top-m', isTopConcept: false})

    expect(next?.concepts.map((concept) => concept.prefLabel)).toEqual([
      'Carbon',
      'Minerals',
      'Zebra',
    ])
  })

  it('leaves a concept that is not a top concept alone', () => {
    const data = tree()
    expect(setTopConceptInTree(data, {conceptId: 'orphan-c', isTopConcept: false})).toBe(data)
  })
})

describe('setTopConceptInTree — contract', () => {
  it('returns null for no tree', () => {
    expect(setTopConceptInTree(null, {conceptId: 'orphan-c', isTopConcept: true})).toBeNull()
  })

  it('never mutates the tree it is given', () => {
    const data = tree()
    const before = JSON.stringify(data)

    setTopConceptInTree(data, {conceptId: 'orphan-c', isTopConcept: true})

    expect(JSON.stringify(data)).toBe(before)
  })
})

describe('isTopConceptApplied', () => {
  it('sees a promotion once the concept is among the top concepts', () => {
    expect(isTopConceptApplied(tree(), {conceptId: 'top-a', isTopConcept: true})).toBe(true)
    expect(isTopConceptApplied(tree(), {conceptId: 'orphan-c', isTopConcept: true})).toBe(false)
  })

  it('sees a demotion once the concept has left the top concepts', () => {
    expect(isTopConceptApplied(tree(), {conceptId: 'orphan-c', isTopConcept: false})).toBe(true)
    expect(isTopConceptApplied(tree(), {conceptId: 'top-a', isTopConcept: false})).toBe(false)
  })

  it('is false with no tree, so a pending change is never dropped early', () => {
    expect(isTopConceptApplied(null, {conceptId: 'top-a', isTopConcept: true})).toBe(false)
  })
})
