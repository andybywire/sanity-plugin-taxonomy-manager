import {describe, expect, it} from 'vitest'

import {perspectiveOption} from './perspective'

describe('perspectiveOption', () => {
  it('maps the default view to the drafts perspective', () => {
    expect(perspectiveOption(undefined)).toBe('drafts')
  })

  it('maps a named perspective to a single-layer stack', () => {
    expect(perspectiveOption('published')).toEqual(['published'])
    expect(perspectiveOption('rMyRelease')).toEqual(['rMyRelease'])
  })

  // `undefined` is the sentinel ReleaseContext documents for "no perspective
  // selected". Testing truthiness instead would send an empty string to
  // `drafts` at one call site and to `['']` at another — the kind of quiet
  // divergence between two queries that this function exists to prevent.
  it('keys on undefined rather than on falsiness', () => {
    expect(perspectiveOption('')).toEqual([''])
  })
})
