import {describe, expect, it} from 'vitest'

import {conceptFilter, prefLabelUniquenessResult} from './validation'

describe('conceptFilter', () => {
  it('excludes self and already-referenced broader/related concepts', () => {
    const result = conceptFilter({
      document: {_id: 'concept-1', broader: [{_ref: 'b-1'}, {_ref: 'b-2'}], related: [{_ref: 'r-1'}]} as never,
    })
    expect(result.filter).toBe('!(_id in $broader || _id in $related || _id == $self)')
    expect(result.params).toEqual({self: 'concept-1', broader: ['b-1', 'b-2'], related: ['r-1']})
  })

  it('defaults broader/related to empty arrays when absent', () => {
    const result = conceptFilter({document: {_id: 'concept-1'} as never})
    expect(result.params.broader).toEqual([])
    expect(result.params.related).toEqual([])
  })

  it('normalizes self to the published id (strips the drafts. prefix)', () => {
    const result = conceptFilter({document: {_id: 'drafts.concept-1'} as never})
    expect(result.params.self).toBe('concept-1')
  })
})

describe('prefLabelUniquenessResult', () => {
  it('returns the error when a different published concept already uses the label', () => {
    expect(prefLabelUniquenessResult('other-concept', 'concept-1')).toBe(
      'Preferred Label must be unique.',
    )
  })

  it('passes when the existing match is the current document (draft or published)', () => {
    expect(prefLabelUniquenessResult('concept-1', 'drafts.concept-1')).toBe(true)
    expect(prefLabelUniquenessResult('concept-1', 'concept-1')).toBe(true)
  })

  it('passes when no existing concept uses the label', () => {
    expect(prefLabelUniquenessResult(null, 'concept-1')).toBe(true)
    expect(prefLabelUniquenessResult(undefined, 'concept-1')).toBe(true)
  })
})
