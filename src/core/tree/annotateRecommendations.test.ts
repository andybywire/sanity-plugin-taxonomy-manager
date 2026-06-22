import {describe, expect, it} from 'vitest'

import type {ChildConceptTerm} from '../../types'

import {annotateRecommendations} from './annotateRecommendations'

function node(id: string, childConcepts?: ChildConceptTerm[]): ChildConceptTerm {
  return {id, prefLabel: id, ...(childConcepts ? {childConcepts} : {})}
}

describe('annotateRecommendations', () => {
  it('marks a matching node as recommended', () => {
    const result = annotateRecommendations(node('c-1'), new Set(['c-1']))
    expect(result.recommended).toBe(true)
  })

  it('normalizes the node id (strips drafts. prefix) before lookup', () => {
    const result = annotateRecommendations(node('drafts.c-1'), new Set(['c-1']))
    expect(result.recommended).toBe(true)
  })

  it('leaves recommended and hasMatchingDescendant unset when nothing matches', () => {
    const result = annotateRecommendations(node('c-1'), new Set())
    expect(result.recommended).toBeUndefined()
    expect(result.hasMatchingDescendant).toBeUndefined()
  })

  it('flags hasMatchingDescendant up the ancestor chain when a descendant is recommended', () => {
    const tree = node('root', [node('mid', [node('leaf')])])
    const result = annotateRecommendations(tree, new Set(['leaf']))

    expect(result.recommended).toBeUndefined()
    expect(result.hasMatchingDescendant).toBe(true)
    expect(result.childConcepts?.[0]?.hasMatchingDescendant).toBe(true)
    expect(result.childConcepts?.[0]?.childConcepts?.[0]?.recommended).toBe(true)
  })

  it('does not mutate the input node', () => {
    const input = node('c-1', [node('c-2')])
    annotateRecommendations(input, new Set(['c-1']))
    expect(input).toEqual(node('c-1', [node('c-2')]))
  })
})
