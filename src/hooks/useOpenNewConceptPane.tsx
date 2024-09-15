import {useCallback, useContext} from 'react'
import {usePaneRouter} from 'sanity/structure'
import {RouterContext} from 'sanity/router'

/**
 * Open in New Pane Link for Concepts
 */
export function useOpenNewConceptPane() {
  const routerContext = useContext(RouterContext)
  const {routerPanesState, groupIndex} = usePaneRouter()

  const openInNewPane = useCallback(
    (conceptId: string) => {
      if (!routerContext || !conceptId) {
        return
      }

      const panes = [...routerPanesState]
      panes.splice(groupIndex + 1, groupIndex + 1, [
        {
          id: conceptId,
          params: {type: 'skosConcept'},
        },
      ])

      const href = routerContext.resolvePathFromState({panes})
      routerContext.navigateUrl({path: href})
    },
    [routerContext, routerPanesState, groupIndex]
  )

  return openInNewPane
}
