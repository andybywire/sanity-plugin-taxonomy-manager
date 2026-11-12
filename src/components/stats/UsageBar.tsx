import {Box} from '@sanity/ui'

import {usageFraction} from '../../core/usage'

import {BAR_HEIGHT, BAR_RADIUS, TRACK_WIDTH} from './lane'

/**
 * #### Usage Bar
 * One term's tagged-resource count as a length, against the scheme's busiest
 * term.
 *
 * **One flat color, never a ramp.** Length already encodes magnitude, and
 * shading nominal categories darker-where-bigger encodes it twice — an
 * explicit anti-pattern, and one that would also read as a second meaning the
 * view does not have.
 *
 * **The track is drawn even at zero.** A zero-length bar is invisible, and
 * invisible is precisely wrong here: unused terms are what a steward opens
 * this view to find. An empty track in a lane of full ones is legible at a
 * glance, and a wholly dead branch becomes a run of them.
 *
 * **Hidden from assistive technology.** The count beside it is the same number
 * in a form a screen reader can already read, so announcing the bar as well
 * would say everything twice.
 *
 * Colors come from the `@sanity/ui` theme rather than from the design file's
 * hex values, the same choice `ConceptStatusMarkers` makes and for the same
 * reason: the view follows the theme into dark mode without us tracking two
 * palettes. The design's measured `#2A78D6` and `#E3E4E8` are light-mode
 * renderings, not sources.
 */
export function UsageBar({count, max}: {count: number; max: number}) {
  const fraction = usageFraction(count, max)

  return (
    <Box
      aria-hidden="true"
      // A handle of our own. `aria-hidden` alone does not identify this: the
      // reserved caret that holds a childless row's slot open carries it too.
      data-taxonomy-usage-bar=""
      style={{
        width: TRACK_WIDTH,
        height: BAR_HEIGHT,
        flexShrink: 0,
        borderRadius: BAR_RADIUS,
        backgroundColor: 'var(--card-border-color)',
      }}
    >
      {fraction > 0 && (
        <Box
          style={{
            width: `${fraction * 100}%`,
            height: '100%',
            borderRadius: BAR_RADIUS,
            backgroundColor: 'var(--card-badge-primary-dot-color)',
          }}
        />
      )}
    </Box>
  )
}
