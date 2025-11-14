import {Card, Label, Stack, Text} from '@sanity/ui'

/**
 * #### No Concepts Guide
 * Prompts adding concepts to an empty scheme.
 */
export const NoConcepts = () => {
  return (
    <div style={{marginTop: '2rem'}}>
      <Card padding={[3, 3, 4]} radius={2} shadow={1} tone="primary">
        <Stack space={4}>
          <Label size={4}>No Concepts</Label>
          <Text size={2}>
            There are not yet any concepts assigned to this scheme. To create a multi-level
            hierarchy with specific entry points, create Top Concepts first, then add child concepts
            to them. To create a flat list of concepts, create Concepts directly.
          </Text>
        </Stack>
      </Card>
    </div>
  )
}
