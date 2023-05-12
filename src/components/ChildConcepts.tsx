import styled from 'styled-components'
import {Tooltip, Box, Stack, Text, Button} from '@sanity/ui'
import {ErrorOutlineIcon} from '@sanity/icons'
import {ChildConceptTerm} from '../types'
import {hues} from '@sanity/color'
// import {useOpenInNewPane} from 'sanity-plugin-utils'
import {usePaneRouter} from 'sanity/desk'
import {RouterContext} from 'sanity/router'
import {useCallback, useContext} from 'react'

const StyledChildConcept = styled.ul`
  list-style: none;
  li {
    font-weight: normal;
    margin-top: 0.75rem;
    svg {
      color: ${hues.red[500].hex};
    }
    span {
      cursor: pointer;
      &:hover {
        text-decoration: underline;
      }
    }
  }
`

function ConceptDetailLink(concept?: any) {
  const routerContext = useContext(RouterContext)
  const {routerPanesState, groupIndex} = usePaneRouter()

  const {id, prefLabel} = concept.concept

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

  return <span onClick={openInNewPane}>{prefLabel}</span>
}

export const ChildConcepts = ({concepts}: {concepts: ChildConceptTerm[]}) => {
  return (
    <StyledChildConcept>
      {concepts.map((concept: any) => {
        return (
          <li key={concept.id}>
            <ConceptDetailLink concept={concept} />
            {concept.childConcepts?.length > 0 && concept.level == 5 && (
              <Tooltip
                content={
                  <Box padding={2} sizing="border">
                    <Stack padding={1} space={2}>
                      <Text muted size={1}>
                        This concept has unlisted child concepts.
                      </Text>
                      <Text muted size={1}>
                        The maximum hierarchy depth is 5 levels.
                      </Text>
                    </Stack>
                  </Box>
                }
                fallbackPlacements={['right', 'left']}
                placement="top"
              >
                <ErrorOutlineIcon />
              </Tooltip>
            )}
            {concept.childConcepts?.length > 0 && concept.level < 5 && (
              <ChildConcepts concepts={concept.childConcepts} />
            )}
          </li>
        )
      })}
    </StyledChildConcept>
  )
}
