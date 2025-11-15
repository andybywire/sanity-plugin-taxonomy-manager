/* eslint-disable react/require-default-props */
import {Button, Text, Box, Badge, Tooltip} from '@sanity/ui'
import {useCallback, useContext} from 'react'
import {RouterContext} from 'sanity/router'
import {usePaneRouter} from 'sanity/structure'

import type {ChildConceptTerm} from '../../types'

/**
 * #### Concept Detail Link
 * Renders a link to a concept in the hierarchy tree that opens in a new pane.
 */
export function ConceptDetailLink({
  concept,
  topConcept = false,
  orphan = false,
}: {
  concept: ChildConceptTerm
  topConcept?: boolean
  orphan?: boolean
}) {
  const routerContext = useContext(RouterContext)
  const {routerPanesState, groupIndex} = usePaneRouter()

  const {id, prefLabel} = concept ?? {}
  const displayLabel = prefLabel || '[new concept]'

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
