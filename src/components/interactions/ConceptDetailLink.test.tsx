import {screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {buildTheme} from '@sanity/ui/theme'

import {renderWithUi} from '../../test/renderWithUi'
import type {ChildConceptTerm} from '../../types'

import {ConceptDetailLink} from './ConceptDetailLink'

// The link reads Studio's pane router to know which concept is open beside the
// tree. jsdom has no pane router, so stub it and drive the pane state per test.
const mocks = vi.hoisted(() => ({usePaneRouter: vi.fn()}))

vi.mock('sanity/structure', () => ({usePaneRouter: mocks.usePaneRouter}))

/**
 * The current-row colors, read from the theme the test renders with — the same
 * palette the component reads. Restating the hex values here would pin the
 * theme's palette rather than the component's wiring to it.
 */
const theme = buildTheme()
// `selectable` is optional on the theme type. If a future `@sanity/ui` drops
// it, failing here is the right outcome: the component's cue would be gone.
// `buildTheme()` types this state as `ThemeColorGenericState`, which does not
// declare `badge` — the value carries it, and `useTheme_v2()` types it, but the
// builder's own type is narrower. Cast rather than restate the hex values,
// which would pin the palette instead of the component's wiring to it.
const selected = theme.color.light.default.selectable!.default.selected as unknown as {
  bg: string
  fg: string
  badge: Record<'caution' | 'positive', {dot: string}>
}
const toRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`
}
const selectedBg = () => toRgb(selected.bg)

/** WCAG relative luminance, for asserting the chip clears AA on its own text. */
const luminance = (c: string) => {
  const [r, g, b] = (
    c.startsWith('#')
      ? [0, 2, 4].map((i) => parseInt(c.replace('#', '').slice(i, i + 2), 16))
      : c.match(/\d+/g)!.map(Number)
  ).map((v) => {
    const x = v / 255
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
const selectedFg = () => toRgb(selected.fg)

const concept = (over: Partial<ChildConceptTerm> = {}): ChildConceptTerm => ({
  id: 'concept-1',
  prefLabel: 'Mathematics',
  ...over,
})

/** Tree pane at index 0, so the concept pane — if any — is the group at index 1. */
function panes(openId?: string) {
  return {
    routerPanesState: openId ? [[{id: 'scheme-1'}], [{id: openId}]] : [[{id: 'scheme-1'}]],
    groupIndex: 0,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.usePaneRouter.mockReturnValue(panes())
})

describe('ConceptDetailLink (current-concept marking)', () => {
  it('marks the concept open in the pane to the right as current', () => {
    mocks.usePaneRouter.mockReturnValue(panes('concept-1'))
    renderWithUi(<ConceptDetailLink concept={concept()} />)

    expect(screen.getByRole('button', {name: /Mathematics/})).toHaveAttribute(
      'aria-current',
      'true',
    )
  })

  it('leaves a concept that is not open unmarked', () => {
    mocks.usePaneRouter.mockReturnValue(panes('concept-2'))
    renderWithUi(<ConceptDetailLink concept={concept()} />)

    expect(screen.getByRole('button', {name: /Mathematics/})).not.toHaveAttribute('aria-current')
  })

  it('leaves every concept unmarked when no concept pane is open', () => {
    renderWithUi(<ConceptDetailLink concept={concept()} />)

    expect(screen.getByRole('button', {name: /Mathematics/})).not.toHaveAttribute('aria-current')
  })

  // The create-a-concept path opens `drafts.<uuid>` while the tree's node ids
  // come back published — the newly created concept only matches once both
  // sides are normalized.
  it('marks a concept opened as a draft in the pane to the right', () => {
    mocks.usePaneRouter.mockReturnValue(panes('drafts.concept-1'))
    renderWithUi(<ConceptDetailLink concept={concept()} />)

    expect(screen.getByRole('button', {name: /Mathematics/})).toHaveAttribute(
      'aria-current',
      'true',
    )
  })

  it('does not mark the active concept in the input tree', () => {
    mocks.usePaneRouter.mockReturnValue(panes('concept-1'))
    renderWithUi(<ConceptDetailLink concept={concept()} inputComponent />)

    expect(screen.getByRole('button', {name: /Mathematics/})).not.toHaveAttribute('aria-current')
  })
})

describe('ConceptDetailLink (current-row fill)', () => {
  // Studio fills the item whose pane is open with a solid blue and keeps grey
  // for hover and for ancestors. An outline here — this plugin's own earlier
  // invention — read as foreign beside the panes either side of it.
  it('fills the current row with the theme’s selected background', () => {
    mocks.usePaneRouter.mockReturnValue(panes('concept-1'))
    renderWithUi(<ConceptDetailLink concept={concept()} />)

    const button = screen.getByRole('button', {name: /Mathematics/})
    expect(button.style.backgroundColor).toBe(selectedBg())
  })

  it('leaves a row that is not current unfilled, so hover stays the grey', () => {
    mocks.usePaneRouter.mockReturnValue(panes('concept-2'))
    renderWithUi(<ConceptDetailLink concept={concept()} />)

    expect(screen.getByRole('button', {name: /Mathematics/}).style.backgroundColor).toBe('')
  })

  // `Text` declares its own color, so the fill alone would leave dark label
  // text on a solid blue.
  it('recolors the label to the paired foreground', () => {
    mocks.usePaneRouter.mockReturnValue(panes('concept-1'))
    renderWithUi(<ConceptDetailLink concept={concept()} />)

    // `Text` styles its own wrapper; `getByText` matches the span inside it.
    const label = screen.getByText('Mathematics').closest('[data-ui="Text"]') as HTMLElement
    expect(label.style.color).toBe(selectedFg())
  })

  it('carries no outline, which is what it used to be marked with', () => {
    mocks.usePaneRouter.mockReturnValue(panes('concept-1'))
    renderWithUi(<ConceptDetailLink concept={concept()} />)

    expect(screen.getByRole('button', {name: /Mathematics/}).style.outline).toBe('')
  })

  // `@sanity/ui` draws the focus ring with box-shadow. Setting one inline here
  // would win over it and leave a keyboard user unable to see where they are —
  // a worse bug than the one being fixed, so the mechanism is pinned.
  it('does not set an inline box-shadow, which would override the focus ring', () => {
    mocks.usePaneRouter.mockReturnValue(panes('concept-1'))
    renderWithUi(<ConceptDetailLink concept={concept()} />)

    expect(screen.getByRole('button', {name: /Mathematics/}).style.boxShadow).toBe('')
  })
})

describe('ConceptDetailLink (current row — markers and chip)', () => {
  const markers = ['draft', 'published'] as const

  // The two dots mean different things. An earlier version passed one
  // foreground for both and they went monochrome on a selected row; the state
  // carries its own paired badge colors for exactly this.
  it('keeps the two publication dots distinct on a current row', () => {
    mocks.usePaneRouter.mockReturnValue(panes('concept-1'))
    renderWithUi(<ConceptDetailLink concept={concept()} statusMarkers={markers} />)

    const ring = document.querySelector('[data-sanity-icon="ring"]') as HTMLElement
    const dot = document.querySelector('[data-sanity-icon="circle-small"]') as HTMLElement
    expect(ring.style.color).toBe(toRgb(selected.badge.caution.dot))
    expect(dot.style.color).toBe(toRgb(selected.badge.positive.dot))
    expect(ring.style.color).not.toBe(dot.style.color)
  })

  it('leaves the dots on the card variables when the row is not current', () => {
    mocks.usePaneRouter.mockReturnValue(panes('concept-2'))
    renderWithUi(<ConceptDetailLink concept={concept()} statusMarkers={markers} />)

    const dot = document.querySelector('[data-sanity-icon="circle-small"]') as HTMLElement
    expect(dot.style.color).toBe('var(--card-badge-positive-dot-color)')
  })

  // The earlier version of this test asserted `style.color` on the Badge root
  // and passed while the chip rendered muted text: `Badge` wraps its children
  // in a `Text` that declares `color: var(--card-fg-color)`, which wins over
  // anything inherited. The variable is what actually reaches the glyph, so
  // that is what is pinned. jsdom does not resolve custom properties, so the
  // assertion is on the value set rather than on a computed color.
  it('reaches the chip’s nested Text through the card foreground variable', () => {
    mocks.usePaneRouter.mockReturnValue(panes('concept-1'))
    renderWithUi(<ConceptDetailLink concept={concept()} topConcept />)

    const chip = screen.getByText('top concept').closest('[data-ui="Badge"]') as HTMLElement
    expect(chip.style.getPropertyValue('--card-fg-color')).toBe(selected.fg)
  })

  it('grounds the chip in a grey that clears AA against its own text', () => {
    mocks.usePaneRouter.mockReturnValue(panes('concept-1'))
    renderWithUi(<ConceptDetailLink concept={concept()} topConcept />)

    const chip = screen.getByText('top concept').closest('[data-ui="Badge"]') as HTMLElement
    // 10px text is well under the large-text threshold, so AA is 4.5:1.
    expect(contrast(chip.style.backgroundColor, selected.fg)).toBeGreaterThanOrEqual(4.5)
  })

  // Two failure modes, opposite directions, and only the pair describes the
  // chip. Too close to the row and it vanishes — the grey this replaced
  // measured 1.06:1 and disappeared while its AA test stayed green. Too far
  // and it separates harder than the badge warrants, which at 2.11:1 read as
  // selection having promoted it.
  //
  // Both bounds are observed rather than derived. The light ground was walked
  // up a notch at a time until it broke: 1.43:1 was right and **1.49:1 was too
  // much**, so the ceiling sits between them. The dark ground is 1.19:1, near
  // the 1.16:1 an ordinary chip measures against its own row, which is the
  // floor's reference.
  it('steps the chip off the row without letting it shout', () => {
    mocks.usePaneRouter.mockReturnValue(panes('concept-1'))
    renderWithUi(<ConceptDetailLink concept={concept()} topConcept />)

    const chip = screen.getByText('top concept').closest('[data-ui="Badge"]') as HTMLElement
    const separation = contrast(chip.style.backgroundColor, selected.bg)
    expect(separation).toBeGreaterThanOrEqual(1.05)
    expect(separation).toBeLessThanOrEqual(1.46)
  })

  it('leaves the chip alone when the row is not current', () => {
    mocks.usePaneRouter.mockReturnValue(panes('concept-2'))
    renderWithUi(<ConceptDetailLink concept={concept()} topConcept />)

    const chip = screen.getByText('top concept').closest('[data-ui="Badge"]') as HTMLElement
    expect(chip.style.backgroundColor).toBe('')
  })
})
