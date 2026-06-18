import {describe, expect, it} from 'vitest'

import {createId} from './createId'

const DEFAULT_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

// nanoid is non-deterministic, so these assert SHAPE (length, charset, prefix),
// not exact values — pinning the configurable id format the plugin ships with.
describe('createId', () => {
  it('generates a 6-character id from the default alphabet', () => {
    const id = createId()
    expect(id).toHaveLength(6)
    expect([...id].every((char) => DEFAULT_ALPHABET.includes(char))).toBe(true)
  })

  it('honors a custom length', () => {
    expect(createId({length: 10})).toHaveLength(10)
  })

  it('honors a custom alphabet/pattern', () => {
    const id = createId({pattern: 'abc'})
    expect(id).toHaveLength(6)
    expect(/^[abc]{6}$/.test(id)).toBe(true)
  })

  it('prepends a prefix on top of the generated length', () => {
    const id = createId({prefix: 'Q', length: 5})
    expect(id.startsWith('Q')).toBe(true)
    expect(id).toHaveLength(6) // prefix (1) + 5 generated chars
  })

  it('produces a different id on each call', () => {
    expect(createId()).not.toBe(createId())
  })
})
