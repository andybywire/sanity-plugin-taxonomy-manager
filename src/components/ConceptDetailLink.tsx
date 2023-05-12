import {usePaneRouter} from 'sanity/desk'
import {RouterContext} from 'sanity/router'
import {useCallback, useContext} from 'react'
import {ChildConceptTerm} from '../types'
import styled from 'styled-components'

const StyledConceptLink = styled.span`
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`

export function ConceptDetailLink({concept}: {concept: ChildConceptTerm}) {
  const routerContext = useContext(RouterContext)
  const {routerPanesState, groupIndex} = usePaneRouter()

  const {id, prefLabel} = concept

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

  return <StyledConceptLink onClick={openInNewPane}>{prefLabel}</StyledConceptLink>
}
