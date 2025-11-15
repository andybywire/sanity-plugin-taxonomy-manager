// import styles from '../styles/toggleButton.module.css'
import {ToggleArrowRightIcon} from '@sanity/icons'
import {Button} from '@sanity/ui'

import styles from './ToggleButton.module.css'

export function ToggleButton({handler, visibility}: {handler: () => void; visibility: string}) {
  return (
    <Button
      icon={ToggleArrowRightIcon}
      mode={'bleed'}
      aria-expanded={visibility == 'open'}
      onClick={handler}
      className={styles.toggleButton}
    />
  )
}
