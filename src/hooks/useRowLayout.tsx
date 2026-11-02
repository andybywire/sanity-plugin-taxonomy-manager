import {useTheme_v2} from '@sanity/ui'

/**
 * #### Row Layout
 * How the hierarchy row's left edge is built.
 *
 * The row's scaffolding — the drag grip and the disclosure caret — is one
 * control wide, and the tree indents by exactly that per level. A row with no
 * children of its own holds its caret slot open (see `ToggleButton`), so it is
 * the reserved caret that lines sibling labels up; the indent's job is the step
 * between levels, and at one control it puts a child's caret directly under the
 * first letter of its parent's label.
 */

/**
 * Space-scale index for the horizontal padding on a scaffolding button, and for
 * the label's left inset, so the caret and the text beside it are evenly
 * spaced.
 *
 * Tighter than the `@sanity/ui` Button default that the row's action buttons
 * keep. That default is right for an action — a hit target with air around it —
 * but between the caret and the label it is dead space that doubles up with the
 * label's own inset.
 */
export const SLOT_PADDING_X = 2

/** The `fontSize` an `@sanity/ui` Button renders its icon at by default. */
const SLOT_FONT_SIZE = 1

/**
 * The width of one scaffolding control, in pixels.
 *
 * An icon takes up far less room than its nominal size: `@sanity/ui` gives
 * `[data-sanity-icon]` a margin of `(capHeight - iconSize) / 2` on every side
 * to seat it on the text's cap height, which leaves it occupying exactly the
 * cap height — 9px for a 21px chevron at this font size. The control is that
 * plus its padding.
 *
 * Note what a test can and cannot do for this. jsdom has no layout engine, so
 * no unit test can prove the number matches what a browser renders; an earlier
 * version of this missed the negative margin, computed 37px, and had a passing
 * test that only confirmed the same wrong arithmetic. The 25px this returns was
 * checked against the real thing in the Studio. Where a width simply has to be
 * right, hold the slot open with the control itself instead of measuring it.
 */
export function useControlWidth(): number {
  const {font, space} = useTheme_v2()
  const {ascenderHeight, descenderHeight, lineHeight} = font.text.sizes[SLOT_FONT_SIZE]
  const capHeight = lineHeight - ascenderHeight - descenderHeight

  return capHeight + 2 * space[SLOT_PADDING_X]
}
