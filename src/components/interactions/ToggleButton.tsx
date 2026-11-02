import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {Button} from '@sanity/ui'

import {SLOT_PADDING_X} from '../../hooks'

/**
 * #### Toggle Button
 * The caret that opens and closes a row's children.
 *
 * `reserved` renders the same button hidden, holding its slot open so a row
 * with no children keeps its label on the same vertical edge as its siblings'.
 * It is the button itself rather than a box of a matching width because that
 * width is not what it looks like: `@sanity/ui` gives an icon a negative margin
 * to seat it on the text's cap height, so a 21px icon takes up 9px of layout
 * and the control comes out at 25px, not the 21 + padding you would compute.
 * Any number written here would be a guess at that, and would drift the moment
 * the theme changed.
 */
type ToggleButtonProps =
  | {reserved: true; handler?: never; visibility?: never}
  | {reserved?: false; handler: () => void; visibility: string}

export function ToggleButton({handler, visibility, reserved}: ToggleButtonProps) {
  const expanded = visibility === 'open'

  return (
    <Button
      // Rotated inline rather than through a CSS module: this one rule was the
      // only thing the plugin's postcss build step existed for.
      icon={<ChevronRightIcon style={{rotate: expanded ? '90deg' : undefined}} />}
      mode={'bleed'}
      paddingX={SLOT_PADDING_X}
      aria-expanded={reserved ? undefined : expanded}
      aria-hidden={reserved ? 'true' : undefined}
      tabIndex={reserved ? -1 : undefined}
      onClick={handler}
      style={reserved ? {visibility: 'hidden'} : undefined}
    />
  )
}
