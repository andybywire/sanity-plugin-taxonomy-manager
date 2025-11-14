import {useCallback, useContext} from 'react'
import {RouterContext} from 'sanity/router'
import {usePaneRouter} from 'sanity/structure'

import {truncateLabel} from '../../helpers'
import {useLinkColorScheme} from '../../hooks/useLinkColorScheme'
import type {ChildConceptTerm} from '../../types'

import styles from './ConceptDetailLink.module.css'

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
    // eslint-disable-next-line jsx-a11y/anchor-is-valid
    <a
      className={styles.conceptLink}
      href="#"
      onClick={openInNewPane}
      style={{color: linkColor}}
      title={prefLabel}
    >
      {truncateLabel(prefLabel)}
    </a>
  )
}
