import {Button, Text, Box, Badge} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {useCallback, useContext} from 'react'
import {RouterContext} from 'sanity/router'
import {usePaneRouter} from 'sanity/structure'

import {activeConceptId, isActiveConcept} from '../../core/activeConcept'
import type {ChildConceptTerm} from '../../types'

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
}: {
  concept: ChildConceptTerm
  topConcept?: boolean
  orphan?: boolean
  inputComponent?: boolean
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
        paddingLeft={0}
        onClick={openInNewPane}
        width="fill"
        justify={'flex-start'}
        selected={isActive}
        aria-current={isActive ? 'true' : undefined}
      >
        <Text size={2} weight={topConcept ? 'bold' : 'regular'} textOverflow="ellipsis">
          {displayLabel}
          {(topConcept || orphan) && (
            <Badge fontSize={0} marginLeft={3} style={{verticalAlign: 'middle'}}>
              {topConcept ? 'top concept' : 'orphan'}
            </Badge>
          )}
        </Text>
      </Button>
    </Tooltip>
  )
}
