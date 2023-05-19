import {Orphans} from './Orphans'
import {TopConcepts} from './TopConcepts'
import styled from 'styled-components'
import {TopConceptTerm, ChildConceptTerm} from '../types'
import {Card, Stack, Label, Text} from '@sanity/ui'

const StyledTree = styled.ul`
  list-style: none;
  padding-left: 0;
  margin-block-start: 0;
`

export const TreeStructure = (data: any) => {
  const {concepts} = data
  if (concepts.topConcepts === null && concepts.orphans.length === 0)
    return (
      <Card padding={4}>
        <Card padding={[3, 3, 4]} radius={2} shadow={1} tone="caution">
          <Stack space={3}>
            <Label size={3}>No Concepts</Label>
            <Text size={2}>
              There are not yet any concepts assigned to this scheme. To add concepts, got to the
              "Editor" tab and add or create new Top Concepts or Concepts.
            </Text>
          </Stack>
        </Card>
      </Card>
    )

  return (
    <StyledTree>
      {concepts.topConcepts &&
        concepts.topConcepts.map((concept: TopConceptTerm) => {
          return <TopConcepts key={concept?.id} concept={concept} />
        })}
      {concepts.orphans.map((concept: ChildConceptTerm) => {
        return <Orphans key={concept.id} concept={concept} />
      })}
    </StyledTree>
  )
}
