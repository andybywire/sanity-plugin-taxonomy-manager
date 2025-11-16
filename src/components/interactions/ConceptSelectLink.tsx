/* eslint-disable react/require-default-props */
import {Button, Text, Box, Badge, Tooltip} from '@sanity/ui'
import {useCallback} from 'react'

import type {ChildConceptTerm} from '../../types'

/**
 * #### Concept Select Link
 * Writes a concept _ref from the hierarchy tree to the current document
 */
export function ConceptSelectLink({
  concept,
  topConcept = false,
  orphan = false,
  selectConcept,
}: {
  concept: ChildConceptTerm
  topConcept?: boolean
  orphan?: boolean
  selectConcept?: (conceptRef: {
    _ref: string
    _type: 'reference'
    _originalId: string | undefined
  }) => void
}) {
  const {prefLabel, id, _originalId} = concept ?? {}
  const displayLabel = prefLabel || '[new concept]'

  const handleClick = useCallback(() => {
    if (!selectConcept) return

    const conceptRef = {
      _ref: id,
      _type: 'reference' as const,
      _originalId,
    }
    selectConcept(conceptRef)
  }, [id, _originalId, selectConcept])

  return (
    <>
      {selectConcept && (
        <Tooltip
          delay={{open: 750}}
          content={
            <Box padding={1} sizing="content">
              <Text muted size={1}>
                {`Select "${prefLabel}"`}
              </Text>
            </Box>
          }
          fallbackPlacements={['right', 'left', 'bottom']}
          placement="top"
          portal
        >
          <Button
            mode="bleed"
            paddingLeft={0}
            onClick={handleClick}
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
      )}
    </>
  )
}
