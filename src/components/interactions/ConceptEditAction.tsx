import {Box, Text, Button} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import type {ComponentType} from 'react'

/**
 * #### Concept Edit Action
 * One of the row's icon buttons: a bleed button with a tooltip naming what it
 * does, since the icon alone does not.
 *
 * It takes what it draws rather than a named action it looks up. An earlier
 * version switched on `'add' | 'remove'` through a lookup table, and when
 * removal moved into the overflow menu the `'remove'` arm stayed behind
 * unreachable — a whole branch of live-looking configuration for something
 * nothing rendered. Passing the icon and message in keeps the component unable
 * to describe a control that does not exist.
 */
export const ConceptEditAction = ({
  icon,
  message,
  tone = 'positive',
  handler,
}: {
  icon: ComponentType
  /** Both the tooltip text and the accessible name — the icon carries neither. */
  message: string
  tone?: 'positive' | 'critical' | 'caution' | 'primary' | 'default'
  handler: () => void
}) => {
  return (
    <Tooltip
      delay={{open: 750}}
      content={
        <Box padding={1} sizing="content">
          <Text muted size={1}>
            {message}
          </Text>
        </Box>
      }
      fallbackPlacements={['right', 'left']}
      placement="top"
    >
      <Button icon={icon} mode={'bleed'} onClick={handler} tone={tone} aria-label={message} />
    </Tooltip>
  )
}
