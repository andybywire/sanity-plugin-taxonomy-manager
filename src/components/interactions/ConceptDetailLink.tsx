import {Button, Text} from '@sanity/ui'
import {useCallback, useContext} from 'react'
import {RouterContext} from 'sanity/router'
import {usePaneRouter} from 'sanity/structure'

// import {truncateLabel} from '../../helpers'
// import {useLinkColorScheme} from '../../hooks/useLinkColorScheme'
import type {ChildConceptTerm} from '../../types'

/**
 * #### Concept Detail Link
 * Renders a link to a concept in the hierarchy tree that opens in a new pane.
 */
export function ConceptDetailLink({
  concept,
  topConcept = false,
}: {
  concept: ChildConceptTerm
  // eslint-disable-next-line react/require-default-props
  topConcept?: boolean
}) {
  const routerContext = useContext(RouterContext)
  const {routerPanesState, groupIndex} = usePaneRouter()

  // const linkColor = useLinkColorScheme()

  const {id, prefLabel} = concept ?? {}

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
    <Button
      mode="bleed"
      paddingLeft={0}
      onClick={openInNewPane}
      width="fill"
      justify={'flex-start'}
    >
      <Text size={2} weight={topConcept ? 'bold' : 'regular'} textOverflow="ellipsis">
        {prefLabel}
        {/* {topConcept && ` top concept`} */}
      </Text>
    </Button>
  )
}
