/**
 * Concept Detail Link
 * Renders a link to a concept in the hierarchy tree that opens in a new pane.
 */

// import {useCallback, useContext} from 'react'
// import {usePaneRouter} from 'sanity/desk'
// import {RouterContext} from 'sanity/router'
import {ChildConceptTerm} from '../types'
import {StyledConceptLink} from '../styles'

export function ConceptSelectLink({
  concept,
  selectConcept,
}: {
  concept: ChildConceptTerm
  selectConcept: any
}) {
  // const routerContext = useContext(RouterContext)
  // const {routerPanesState, groupIndex} = usePaneRouter()

  const {prefLabel} = concept ?? {}

  // const openInNewPane = useCallback(() => {
  //   if (!routerContext || !id) {
  //     return
  //   }

  //   const panes = [...routerPanesState]
  //   panes.splice(groupIndex + 1, groupIndex + 1, [
  //     {
  //       id: id,
  //       params: {type: 'skosConcept'},
  //     },
  //   ])

  //   const href = routerContext.resolvePathFromState({panes})
  //   routerContext.navigateUrl({path: href})
  // }, [id, routerContext, routerPanesState, groupIndex])

  return (
    <StyledConceptLink href="#" onClick={() => selectConcept(prefLabel)}>
      {prefLabel}
    </StyledConceptLink>
  )
}
