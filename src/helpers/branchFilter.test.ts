import {describe, expect, it, vi} from 'vitest'

import {branchFilter} from './branchFilter'

type FilterProps = Parameters<ReturnType<typeof branchFilter>>[0]

function stubProps(result: {concepts: string[]}) {
  const fetch = vi.fn().mockResolvedValue(result)
  const getClient = vi.fn(() => ({fetch}))
  return {props: {getClient} as unknown as FilterProps, fetch, getClient}
}

describe('branchFilter', () => {
  it('throws synchronously when schemeId is missing or not a string', () => {
    expect(() => branchFilter({branchId: 'd4e5f6'} as never)).toThrow(
      'Invalid or missing schemeId: scheme Id must be a string',
    )
  })

  it('throws synchronously when branchId is missing or not a string', () => {
    expect(() => branchFilter({schemeId: 'abc123'} as never)).toThrow(
      'Invalid or missing branchId: branch Id must be a string',
    )
  })

  it('fetches with apiVersion 2023-01-01 and returns the filter, params, and options', async () => {
    const {props, fetch, getClient} = stubProps({concepts: ['concept-x', 'concept-y']})

    const result = await branchFilter({
      schemeId: 'abc123',
      branchId: 'd4e5f6',
      expanded: true,
      browseOnly: true,
    })(props)

    expect(getClient).toHaveBeenCalledWith({apiVersion: '2023-01-01'})
    expect(result.filter).toMatchInlineSnapshot(`"_id in $concepts"`)
    expect(result.params).toEqual({
      concepts: ['concept-x', 'concept-y'],
      schemeId: 'abc123',
      branchId: 'd4e5f6',
    })
    expect(result.expanded).toBe(true)
    expect(result.browseOnly).toBe(true)
    // schemeId and branchId are passed as GROQ params (not interpolated)
    expect(fetch.mock.calls[0]?.[1]).toEqual({schemeId: 'abc123', branchId: 'd4e5f6'})
  })
})
