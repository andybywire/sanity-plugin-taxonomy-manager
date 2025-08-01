import {useCallback, useContext} from 'react'
import {RouterContext} from 'sanity/router'
import {usePaneRouter} from 'sanity/structure'

import {useLinkColorScheme} from '../../hooks/useLinkColorScheme'
import {StyledConceptLink} from '../../styles'
import type {ChildConceptTerm} from '../../types'

/**
 * #### Concept Detail Link
 * Renders a link to a concept in the hierarchy tree that opens in a new pane.
 */
export function ConceptDetailLink({concept}: {concept: ChildConceptTerm}) {
  const routerContext = useContext(RouterContext)
  const {routerPanesState, groupIndex} = usePaneRouter()

  const linkColor = useLinkColorScheme()

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
    <StyledConceptLink href="#" onClick={openInNewPane} style={{color: linkColor}}>
      {prefLabel}
    </StyledConceptLink>
  )
}
