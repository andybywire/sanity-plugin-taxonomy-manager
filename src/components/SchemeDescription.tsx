import {Box, Stack, Text} from '@sanity/ui'

/**
 * #### Scheme Description
 * The scheme's description, above the hierarchy.
 *
 * Shared by the Tree View and the governance view rather than written twice.
 * It is not decoration in the second view: the block sets where the tree
 * starts, so a view without it begins higher than its sibling and the two
 * stop lining up when an editor switches tabs.
 *
 * `paddingTop={5}` is 32px on the `@sanity/ui` space scale — taken from the
 * scale rather than written as a number, and chosen so the heading sits level
 * with the first text in the Editor pane beside it.
 *
 * Renders nothing at all when the scheme has no description, so an empty
 * block cannot push the tree down in one view and not the other.
 */
export function SchemeDescription({description}: {description?: string}) {
  if (!description) return null

  return (
    <Box padding={4} paddingTop={5}>
      <Stack gap={2}>
        <Text size={1} weight="semibold">
          Description
        </Text>
        <Text size={2} muted>
          {description}
        </Text>
      </Stack>
    </Box>
  )
}
