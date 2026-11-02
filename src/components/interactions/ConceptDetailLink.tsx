import {Button, Text, Box, Badge, Flex} from '@sanity/ui'

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

  const {id, prefLabel} = concept ?? {}
  const displayLabel = prefLabel || '[new concept]'

  // Input trees render this link only for concepts with no prefLabel, so a
  // highlight there would mark one '[new concept]' row among siblings that
  // can never mark (they render ConceptSelectLink) — a rendering bug, not a cue.
  const isActive =
    !inputComponent && isActiveConcept(id, activeConceptId(routerPanesState, groupIndex))

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
        selected={isActive}
        aria-current={isActive ? 'true' : undefined}
      >
        {/* Button lays its own `justify` out only for the `text`/`icon` props;
            anything passed as children goes into a plain Box, which would stack
            the label and the dots. So the row inside the button is ours. */}
        <Flex align="center" gap={2}>
          {/* The label takes whatever the markers leave, and `minWidth` lets it
              shrink below its own text so it ellipsizes there rather than
              widening the row. */}
          <Box flex={1} style={{minWidth: 0}}>
            <Text size={2} weight={topConcept ? 'bold' : 'regular'} textOverflow="ellipsis">
              {displayLabel}
              {(topConcept || orphan) && (
                <Badge fontSize={0} marginLeft={3} style={{verticalAlign: 'middle'}}>
                  {topConcept ? 'top concept' : 'orphan'}
                </Badge>
              )}
            </Text>
          </Box>
          {statusMarkers && <ConceptStatusMarkers markers={statusMarkers} />}
        </Flex>
      </Button>
    </Tooltip>
  )
}
