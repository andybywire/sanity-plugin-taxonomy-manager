import {ToggleArrowRightIcon} from '@sanity/icons/ToggleArrowRight'
import {Button} from '@sanity/ui'

export function ToggleButton({handler, visibility}: {handler: () => void; visibility: string}) {
  const expanded = visibility == 'open'

  return (
    <Button
      // Rotated inline rather than through a CSS module: this one rule was the
      // only thing the plugin's postcss build step existed for.
      icon={<ToggleArrowRightIcon style={{rotate: expanded ? '90deg' : undefined}} />}
      mode={'bleed'}
      aria-expanded={expanded}
      onClick={handler}
    />
  )
}
