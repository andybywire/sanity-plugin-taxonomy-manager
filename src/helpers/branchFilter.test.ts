import {describe, it, expect, vi, beforeEach} from 'vitest'

import {branchFilter} from './branchFilter'

describe('branchFilter', () => {
  const mockGetClient = vi.fn()
  const mockClient = {
    fetch: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetClient.mockReturnValue(mockClient)
  })

  it('should create a filter function with valid options', () => {
    const options = {
      schemeId: 'a1b2c3',
      branchId: 'd4e5f6',
    }

    const filterFn = branchFilter(options)
    expect(typeof filterFn).toBe('function')
  })

  it('should throw error for missing schemeId', () => {
    const options = {
      schemeId: '',
      branchId: 'd4e5f6',
    }

    expect(() => branchFilter(options)).toThrow(
      'Invalid or missing schemeId: scheme Id must be a string'
    )
  })

  it('should throw error for missing branchId', () => {
    const options = {
      schemeId: 'a1b2c3',
      branchId: '',
    }

    expect(() => branchFilter(options)).toThrow(
      'Invalid or missing branchId: branch Id must be a string'
    )
  })

  it('should throw error for non-string schemeId', () => {
    const options = {
      schemeId: 123 as any,
      branchId: 'd4e5f6',
    }

    expect(() => branchFilter(options)).toThrow(
      'Invalid or missing schemeId: scheme Id must be a string'
    )
  })

  it('should throw error for non-string branchId', () => {
    const options = {
      schemeId: 'a1b2c3',
      branchId: 456 as any,
    }

    expect(() => branchFilter(options)).toThrow(
      'Invalid or missing branchId: branch Id must be a string'
    )
  })

  it('should return filter result with correct structure', async () => {
    const options = {
      schemeId: 'a1b2c3',
      branchId: 'd4e5f6',
    }

    const mockConcepts = ['concept1', 'concept2', 'concept3']
    mockClient.fetch.mockResolvedValue({concepts: mockConcepts})

    const filterFn = branchFilter(options)
    const result = await filterFn({getClient: mockGetClient})

    expect(result).toEqual({
      filter: '!(_id in path("drafts.**")) && _id in $concepts',
      params: {
        concepts: mockConcepts,
        schemeId: 'a1b2c3',
        branchId: 'd4e5f6',
      },
    })
  })

  it('should call client fetch with correct parameters', async () => {
    const options = {
      schemeId: 'a1b2c3',
      branchId: 'd4e5f6',
    }

    mockClient.fetch.mockResolvedValue({concepts: []})

    const filterFn = branchFilter(options)
    await filterFn({getClient: mockGetClient})

    expect(mockGetClient).toHaveBeenCalledWith({apiVersion: '2023-01-01'})
    expect(mockClient.fetch).toHaveBeenCalledWith(
      expect.stringContaining('schemeId == $schemeId'),
      {schemeId: 'a1b2c3', branchId: 'd4e5f6'}
    )
  })

  it('should throw error when client is not available', async () => {
    const options = {
      schemeId: 'a1b2c3',
      branchId: 'd4e5f6',
    }

    mockGetClient.mockReturnValue(null)

    const filterFn = branchFilter(options)

    await expect(filterFn({getClient: mockGetClient})).rejects.toThrow('Client not available')
  })
})
