import {describe, expect, it, vi} from 'vitest'

import {schemeFilter} from './schemeFilter'

type FilterProps = Parameters<ReturnType<typeof schemeFilter>>[0]

function stubProps(result: {concepts: string[]; topConcepts: string[]}) {
  const fetch = vi.fn().mockResolvedValue(result)
  const getClient = vi.fn(() => ({fetch}))
  return {props: {getClient} as unknown as FilterProps, fetch, getClient}
}

describe('schemeFilter', () => {
  it('throws synchronously when schemeId is missing or not a string', () => {
    expect(() => schemeFilter({} as never)).toThrow(
      'Invalid or missing schemeId: scheme Id must be a string',
    )
    expect(() => schemeFilter({schemeId: 123 as never})).toThrow('Invalid or missing schemeId')
  })

  it('fetches with apiVersion 2025-02-19 and returns the filter, params, and options', async () => {
    const {props, fetch, getClient} = stubProps({
      concepts: ['concept-a', 'concept-b'],
      topConcepts: ['top-1'],
    })

    const result = await schemeFilter({schemeId: 'abc123', expanded: true, browseOnly: true})(props)

    expect(getClient).toHaveBeenCalledWith({apiVersion: '2025-02-19'})
    expect(result.filter).toMatchInlineSnapshot(`
      "(_id in $concepts
                    || _id in $topConcepts)"
    `)
    expect(result.params).toEqual({
      concepts: ['concept-a', 'concept-b'],
      topConcepts: ['top-1'],
      schemeId: 'abc123',
    })
    expect(result.expanded).toBe(true)
    expect(result.browseOnly).toBe(true)
    // schemeId is string-interpolated into the fetch query (not passed as a param)
    expect(fetch.mock.calls[0]?.[0]).toContain('schemeId == "abc123"')
  })

  it('passes expanded/browseOnly through as undefined when omitted', async () => {
    const {props} = stubProps({concepts: [], topConcepts: []})
    const result = await schemeFilter({schemeId: 'abc123'})(props)
    expect(result.expanded).toBeUndefined()
    expect(result.browseOnly).toBeUndefined()
  })
})
