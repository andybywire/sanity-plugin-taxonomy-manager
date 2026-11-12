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
  reserved = false,
}: {
  icon: ComponentType
  /** Both the tooltip text and the accessible name — the icon carries neither. */
  message: string
  tone?: 'positive' | 'critical' | 'caution' | 'primary' | 'default'
  handler?: () => void
  /**
   * Render the same button hidden, holding its slot open so rows that offer
   * fewer actions keep the rest on the same vertical edges. The button itself
   * rather than a box of a matching width, for the reason `ToggleButton`
   * gives: an icon's rendered width is not the number you would compute from
   * its nominal size and padding.
   */
  reserved?: boolean
}) => {
  if (reserved) {
    return (
      <Button
        icon={icon}
        mode={'bleed'}
        tone={tone}
        aria-hidden="true"
        tabIndex={-1}
        style={{visibility: 'hidden'}}
      />
    )
  }

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
