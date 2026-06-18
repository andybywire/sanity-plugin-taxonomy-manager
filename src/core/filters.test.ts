import {describe, expect, it} from 'vitest'

import {
  assertBranchId,
  assertSchemeId,
  buildBranchFilterResult,
  buildSchemeFilterResult,
} from './filters'

describe('assertSchemeId', () => {
  it('throws on a missing or non-string scheme id', () => {
    expect(() => assertSchemeId(undefined)).toThrow(
      'Invalid or missing schemeId: scheme Id must be a string',
    )
    expect(() => assertSchemeId('')).toThrow('Invalid or missing schemeId')
    expect(() => assertSchemeId(123)).toThrow('Invalid or missing schemeId')
  })

  it('accepts a valid scheme id', () => {
    expect(() => assertSchemeId('abc123')).not.toThrow()
  })
})

describe('assertBranchId', () => {
  it('throws on a missing or non-string branch id', () => {
    expect(() => assertBranchId(null)).toThrow(
      'Invalid or missing branchId: branch Id must be a string',
    )
    expect(() => assertBranchId('')).toThrow('Invalid or missing branchId')
  })

  it('accepts a valid branch id', () => {
    expect(() => assertBranchId('d4e5f6')).not.toThrow()
  })
})

describe('buildSchemeFilterResult', () => {
  it('assembles the filter, params, and option passthrough', () => {
    const result = buildSchemeFilterResult({
      schemeId: 'abc123',
      concepts: ['c-a', 'c-b'],
      topConcepts: ['t-1'],
      expanded: true,
      browseOnly: false,
    })
    expect(result.filter).toMatchInlineSnapshot(`
      "(_id in $concepts
                    || _id in $topConcepts)"
    `)
    expect(result.params).toEqual({concepts: ['c-a', 'c-b'], topConcepts: ['t-1'], schemeId: 'abc123'})
    expect(result.expanded).toBe(true)
    expect(result.browseOnly).toBe(false)
  })
})

describe('buildBranchFilterResult', () => {
  it('assembles the filter, params, and option passthrough', () => {
    const result = buildBranchFilterResult({schemeId: 'abc123', branchId: 'd4e5f6', concepts: ['c-x']})
    expect(result.filter).toMatchInlineSnapshot(`"_id in $concepts"`)
    expect(result.params).toEqual({concepts: ['c-x'], schemeId: 'abc123', branchId: 'd4e5f6'})
    expect(result.expanded).toBeUndefined()
    expect(result.browseOnly).toBeUndefined()
  })
})
