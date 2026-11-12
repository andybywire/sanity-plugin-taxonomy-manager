import {Button, Text, Box, Badge, Flex, useTheme_v2} from '@sanity/ui'

import {SLOT_PADDING_X} from '../../hooks'
import {Tooltip} from '@sanity/ui/tooltip'
import {useCallback, useContext} from 'react'
import {RouterContext} from 'sanity/router'
import {usePaneRouter} from 'sanity/structure'

import {activeConceptId, isActiveConcept} from '../../core/activeConcept'
import type {ConceptStatusMarker} from '../../core/publicationStatus'
import type {ChildConceptTerm} from '../../types'

import {ConceptStatusMarkers} from './ConceptStatusMarkers'

/**
 * The `top concept` / `orphan` chip on a current row.
 *
 * A blue off the row's own fill, which is the shape of Studio's answer but not
 * its values: Studio's `selectable…selected.badge.default` measures
 * **2.20:1** between chip and text, so it fails AA outright and is the reason
 * that chip is hard to read in light mode.
 *
 * The chip's text is the row's own `fg`, so it matches the label beside it.
 * Each ground is then a shade of the fill's hue, fixed by two numbers:
 *
 * 1. **AA (4.5:1) against that text.** The chip is 10px, well under the
 *    large-text threshold.
 * 2. **A step against the row that reads without shouting.** There is no
 *    formula for this one. The chip on an ordinary row measures **1.16:1**
 *    against its own and was the starting reference, but the light ground was
 *    found by walking the lightness up a notch at a time until it broke, and
 *    then back: 1.16 and 1.32 too quiet, 1.43 right, **1.49 too much**. The
 *    dark ground sat correctly at the ordinary level first time.
 *
 * - light, white text: `#2D48FB` — 6.12:1 on the text, **1.43:1** on the row
 *   - #324CFB bg is also a slightly toned down possibility if "less" is ever
 *     needed in the future.
 * - dark, near-black text: `#98AAE1` — 8.43:1 on the text, **1.19:1** on the row
 *
 * Each notch is a step in lightness alone. Hue and saturation stay at the
 * row's, which is what keeps the chip reading as the row's own colour, and it
 * means a future adjustment is one value moved along the same line.
 *
 * **The two schemes do not share a recipe, and copying one to the other is
 * what made light mode look dirty.** White text forces the light ground
 * *below* the row's luminance, and a blue that is both darker and less
 * saturated than a vivid ground reads as mud. So the light chip keeps the
 * row's own saturation and takes its whole step from lightness: same hue,
 * same chroma, a shade deeper, which reads as the row's colour rather than a
 * greyed version of it. The dark ground sits *above* its row instead, where
 * desaturating lands on a pastel and stays clean — so that one is held at 55%.
 *
 * Going lighter in light mode would fix the mud the same way, and is not
 * available: the row already sits at the AA threshold for white text, so
 * anything lighter fails.
 */
const CHIP_GROUND_UNDER_LIGHT_TEXT = '#2D48FB'
const CHIP_GROUND_UNDER_DARK_TEXT = '#98aae1'

/**
 * WCAG relative luminance of a `#rrggbb` color — only used to ask whether the
 * current row's foreground is the light one or the dark one.
 */
function relativeLuminance(hex: string): number {
  const h = hex.replace('#', '')
  const channels = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * #### Concept Detail Link
 * Renders a link to a concept in the hierarchy tree that opens in a new pane,
 * marked as current when its document is the one already open there.
 */
export function ConceptDetailLink({
  concept,
  topConcept = false,
  orphan = false,
  inputComponent = false,
  statusMarkers,
}: {
  concept: ChildConceptTerm
  topConcept?: boolean
  orphan?: boolean
  inputComponent?: boolean
  /**
   * Publication dots, drawn at the far end of this button rather than beside it:
   * the button's background is the row's hover and selected shading, and Studio
   * draws the same dots inside that shading, as part of the row rather than as
   * an action next to it. Omitted wherever the markers are gated off.
   */
  statusMarkers?: readonly ConceptStatusMarker[]
}) {
  const routerContext = useContext(RouterContext)
  const {routerPanesState, groupIndex} = usePaneRouter()
  const {color} = useTheme_v2()

  const {id, prefLabel} = concept ?? {}
  const displayLabel = prefLabel || '[new concept]'

  // Input trees render this link only for concepts with no prefLabel, so a
  // highlight there would mark one '[new concept]' row among siblings that
  // can never mark (they render ConceptSelectLink) — a rendering bug, not a cue.
  const isActive =
    !inputComponent && isActiveConcept(id, activeConceptId(routerPanesState, groupIndex))

  // `Text` declares its own color, so the fill alone would leave the label in
  // the enabled foreground — dark text on a solid blue. The palette's paired
  // `fg` has to be put on the text itself, exactly as `ConceptStatusMarkers`
  // puts its dot colors on the glyph rather than on an ancestor.
  const selectedColors = isActive ? color.selectable?.default?.selected : undefined

  // The publication dots on a current row. They keep two distinct colors —
  // the state carries its own badge palette for exactly this, cyan and pink in
  // light, deep teal and olive in dark — because the ring and the dot mean
  // different things and a single foreground would merge them. The mapping is
  // the one `MARKER_STYLE` already uses: draft is caution, published is
  // positive, read from the selected state instead of the enabled card.
  // `Badge` wraps its children in a `Text`, which declares
  // `color: var(--card-fg-color)` — so a `color` set on the Badge is overridden
  // before it reaches the glyph, and the chip's text stayed muted on a current
  // row. Setting the *variable* reaches the inner `Text`, because custom
  // properties inherit. The plain `color` is kept beside it for the day Badge
  // stops nesting one.
  const chipStyle = selectedColors
    ? ({
        verticalAlign: 'middle',
        backgroundColor:
          relativeLuminance(selectedColors.fg) > 0.5
            ? CHIP_GROUND_UNDER_LIGHT_TEXT
            : CHIP_GROUND_UNDER_DARK_TEXT,
        color: selectedColors.fg,
        '--card-fg-color': selectedColors.fg,
      } as React.CSSProperties)
    : ({verticalAlign: 'middle'} as React.CSSProperties)

  const selectedMarkerColors = selectedColors
    ? {
        draft: selectedColors.badge.caution.dot,
        published: selectedColors.badge.positive.dot,
      }
    : undefined

  const openInNewPane = useCallback(() => {
    if (!routerContext || !id) {
      return
    }

    const panes = [...routerPanesState]
    panes.splice(groupIndex + 1, groupIndex + 1, [
      {
        id: id,
        params: {type: 'skosConcept'},
      },
    ])

    const href = routerContext.resolvePathFromState({panes})
    routerContext.navigateUrl({path: href})
  }, [id, routerContext, routerPanesState, groupIndex])

  return (
    <Tooltip
      delay={{open: 750}}
      content={
        <Box padding={1} sizing="content">
          <Text muted size={1}>
            {`View "${prefLabel}"`}
          </Text>
        </Box>
      }
      fallbackPlacements={['right', 'left']}
      placement="top"
    >
      <Button
        mode="bleed"
        paddingLeft={SLOT_PADDING_X}
        onClick={openInNewPane}
        width="fill"
        aria-current={isActive ? 'true' : undefined}
        // Studio's own current-item treatment: a solid blue fill, which is
        // what the structure panes use for the item whose pane is open, while
        // grey stays the hover and the ancestor state. No outline — that was
        // this plugin's own invention and it read as foreign beside the panes
        // either side of it.
        //
        // The colors come from `color.selectable`, the palette Studio styles
        // those items from. It carries both schemes, so dark mode needs no
        // second set of values. Nothing in `@sanity/ui` consumes `selectable`
        // — no component offers this state — so, as with the publication
        // markers, the behavior is reproduced from the theme rather than
        // imported from Studio.
        //
        // A background only, never a `boxShadow`: `@sanity/ui` draws the focus
        // ring with one, and an inline shadow here would override it and leave
        // a keyboard user unable to see where they are.
        style={isActive ? {backgroundColor: selectedColors?.bg} : undefined}
      >
        {/* Button lays its own `justify` out only for the `text`/`icon` props;
            anything passed as children goes into a plain Box, which would stack
            the label and the dots. So the row inside the button is ours. */}
        <Flex align="center" gap={2}>
          {/* The label takes whatever the markers leave, and `minWidth` lets it
              shrink below its own text so it ellipsizes there rather than
              widening the row. */}
          <Box flex={1} style={{minWidth: 0}}>
            <Text
              size={2}
              weight={topConcept ? 'bold' : 'regular'}
              textOverflow="ellipsis"
              style={selectedColors ? {color: selectedColors.fg} : undefined}
            >
              {displayLabel}
              {(topConcept || orphan) && (
                <Badge fontSize={0} marginLeft={3} style={chipStyle}>
                  {topConcept ? 'top concept' : 'orphan'}
                </Badge>
              )}
            </Text>
          </Box>
          {statusMarkers && (
            <ConceptStatusMarkers markers={statusMarkers} colors={selectedMarkerColors} />
          )}
        </Flex>
      </Button>
    </Tooltip>
  )
}
