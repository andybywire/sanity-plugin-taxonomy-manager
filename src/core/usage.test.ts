import {describe, expect, it} from 'vitest'

import {usageFraction, usageMax} from './usage'

describe('usageMax', () => {
  it('is 0 for a scheme with no terms', () => {
    expect(usageMax(new Map())).toBe(0)
  })

  it('is 0 when every term is unused', () => {
    expect(usageMax(new Map([['a', 0]]))).toBe(0)
    expect(
      usageMax(
        new Map([
          ['a', 0],
          ['b', 0],
        ]),
      ),
    ).toBe(0)
  })

  it('is the largest count in the scheme', () => {
    expect(
      usageMax(
        new Map([
          ['a', 19],
          ['b', 148],
          ['c', 71],
        ]),
      ),
    ).toBe(148)
  })

  // The scale is taken over every term the query answered for, not over the
  // rows currently on screen, so collapsing a branch cannot rescale the bars
  // that remain. The map is the whole scheme; nothing here filters it.
  it('is unchanged by which rows are expanded, because it reads the whole map', () => {
    const scheme = new Map([
      ['top', 19],
      ['hidden-child', 148],
    ])
    expect(usageMax(scheme)).toBe(148)
  })

  it('floors at 0 rather than returning a negative', () => {
    expect(usageMax(new Map([['a', -3]]))).toBe(0)
  })
})

describe('usageFraction', () => {
  it('is the count as a share of the scheme maximum', () => {
    expect(usageFraction(148, 148)).toBe(1)
    expect(usageFraction(74, 148)).toBe(0.5)
    // 19/148 — the share the B.3 design writes as `round(12.8%, 1px)`.
    expect(usageFraction(19, 148)).toBeCloseTo(0.1284, 4)
  })

  it('is 0 for an unused term', () => {
    expect(usageFraction(0, 148)).toBe(0)
  })

  // A scheme where nothing is tagged has no scale to divide by. Every bar is
  // empty, which is the honest rendering: no term leads.
  it('is 0 when the whole scheme is unused, rather than dividing by zero', () => {
    expect(usageFraction(0, 0)).toBe(0)
    expect(Number.isFinite(usageFraction(5, 0))).toBe(true)
    expect(usageFraction(5, 0)).toBe(0)
  })

  it('clamps to the 0–1 range', () => {
    expect(usageFraction(200, 148)).toBe(1)
    expect(usageFraction(-5, 148)).toBe(0)
  })
})
