import {describe, expect, it} from 'vitest'

import type {ChildConceptTerm} from '../../types'

import {annotateScores} from './annotateScores'

function node(id: string, childConcepts?: ChildConceptTerm[]): ChildConceptTerm {
  return {id, prefLabel: id, ...(childConcepts ? {childConcepts} : {})}
}

describe('annotateScores', () => {
  it('attaches the score for a matching node', () => {
    const result = annotateScores(node('c-1'), new Map([['c-1', 0.9]]))
    expect(result.score).toBe(0.9)
  })

  it('normalizes the node id (strips drafts. prefix) before lookup', () => {
    const result = annotateScores(node('drafts.c-1'), new Map([['c-1', 0.5]]))
    expect(result.score).toBe(0.5)
  })

  it('leaves score and hasMatchingDescendant unset when nothing matches', () => {
    const result = annotateScores(node('c-1'), new Map())
    expect(result.score).toBeUndefined()
    expect(result.hasMatchingDescendant).toBeUndefined()
  })

  it('flags hasMatchingDescendant up the ancestor chain when a descendant scores', () => {
    const tree = node('root', [node('mid', [node('leaf')])])
    const result = annotateScores(tree, new Map([['leaf', 0.7]]))

    expect(result.score).toBeUndefined()
    expect(result.hasMatchingDescendant).toBe(true)
    expect(result.childConcepts?.[0]?.hasMatchingDescendant).toBe(true)
    expect(result.childConcepts?.[0]?.childConcepts?.[0]?.score).toBe(0.7)
  })

  it('does not mutate the input node', () => {
    const input = node('c-1', [node('c-2')])
    annotateScores(input, new Map([['c-1', 1]]))
    expect(input).toEqual(node('c-1', [node('c-2')]))
  })
})
