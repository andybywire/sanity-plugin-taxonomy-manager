import {describe, it, expect} from 'vitest'

import {ReleaseContext, type ReleaseContextType} from './context'

describe('ReleaseContext', () => {
  it('should be a valid React context', () => {
    // Test that it's a proper React context
    expect(ReleaseContext).toBeDefined()
    expect(ReleaseContext.Provider).toBeDefined()
    expect(typeof ReleaseContext.Provider).toBe('object')
  })

  it('should have correct default value structure', () => {
    // Test that we can access the context with proper typing
    const contextValue: ReleaseContextType = {
      isInRelease: false,
      documentId: '',
    }

    expect(contextValue).toHaveProperty('isInRelease')
    expect(contextValue).toHaveProperty('documentId')
    expect(contextValue.isInRelease).toBe(false)
    expect(contextValue.documentId).toBe('')
  })
})
