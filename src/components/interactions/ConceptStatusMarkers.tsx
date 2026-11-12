import {Flex, Text} from '@sanity/ui'

import type {ConceptStatusMarker} from '../../core/publicationStatus'

/**
 * Studio draws these with `RingIcon` and `CircleSmallIcon` from its own
 * `temporary-icons/` folder, whose files carry the header
 * `THIS FILE IS TEMPORARY - IMPORT FROM @SANITY/ICONS WHEN AVAILABLE`. Neither
 * is exported from `sanity`, and neither exists in `@sanity/icons` yet — so the
 * geometry is copied here rather than imported from something marked for
 * deletion. `@sanity/icons` has no near match: `CircleIcon` is r=8 against the
 * ring's r=2.9. Swap both out when they ship.
 */
const VIEW_BOX = '0 0 25 25'

function DraftRingGlyph(props: {style?: React.CSSProperties}) {
  return (
    <svg
      data-sanity-icon="ring"
      width="1em"
      height="1em"
      viewBox={VIEW_BOX}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx={12.5} cy={12.5} r={2.9} stroke="currentColor" strokeWidth={1.2} />
    </svg>
  )
}

function PublishedDotGlyph(props: {style?: React.CSSProperties}) {
  return (
    <svg
      data-sanity-icon="circle-small"
      width="1em"
      height="1em"
      viewBox={VIEW_BOX}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx={12.5} cy={12.5} r={3.5} fill="currentColor" />
    </svg>
  )
}

/**
 * The badge dot colors from the `@sanity/ui` theme, the same variables Studio's
 * own indicator sets. Taking the tokens rather than hex values means the dots
 * follow the theme into dark mode without us tracking either palette.
 *
 * Set on the glyph itself, not an ancestor: `Text` declares its own color, so a
 * color further up would be overridden before `currentColor` resolved.
 */
const MARKER_STYLE: Record<ConceptStatusMarker, React.CSSProperties> = {
  draft: {color: 'var(--card-badge-caution-dot-color)'},
  published: {color: 'var(--card-badge-positive-dot-color)'},
}

/** What each combination means, said once for assistive technology. */
const MARKER_LABELS: Record<string, string> = {
  'draft,published': 'Published, with unpublished changes',
  published: 'Published',
  draft: 'Not published',
}

/**
 * #### Concept Status Markers
 * The publication dots beside a row: a caution ring for a draft, a positive dot
 * for a published version, in that order.
 *
 * Which dots to draw is decided in `core/publicationStatus`; this draws them.
 * Each sits in a fixed-width slot so rows with different states keep their
 * labels and actions on the same vertical edges, and the glyphs are sized by
 * `Text size={2}` — the row label's size — rather than by a measurement of ours.
 * A derived width is what went wrong in the row-layout pass, and jsdom cannot
 * check one.
 */
export function ConceptStatusMarkers({
  markers,
  colors,
}: {
  markers: readonly ConceptStatusMarker[]
  /**
   * Per-marker colors, for a row drawn on the current-item fill, where the
   * `--card-*` variables still hold the values for an unselected card.
   *
   * A *pair*, not one color for both. The two dots carry different meanings,
   * and flattening them to a single foreground throws that away — which is
   * what an earlier version of this did, and the markers went monochrome on a
   * selected row. Studio keeps them apart there too, with its own paired
   * colors for the state.
   */
  colors?: Record<ConceptStatusMarker, string>
}) {
  if (markers.length === 0) return null

  return (
    <Flex
      align="center"
      role="img"
      aria-label={MARKER_LABELS[markers.join(',')]}
      style={{flexShrink: 0}}
    >
      {markers.map((marker) => (
        <Flex key={marker} align="center" justify="center" style={{width: 15, flexShrink: 0}}>
          <Text size={2}>
            {marker === 'draft' ? (
              <DraftRingGlyph style={colors ? {color: colors.draft} : MARKER_STYLE.draft} />
            ) : (
              <PublishedDotGlyph
                style={colors ? {color: colors.published} : MARKER_STYLE.published}
              />
            )}
          </Text>
        </Flex>
      ))}
    </Flex>
  )
}
