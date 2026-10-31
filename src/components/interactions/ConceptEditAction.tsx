import {AddCircleIcon} from '@sanity/icons/AddCircle'
import {Box, Text, Button} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'

const MESSAGE = 'Add a child concept below this concept'

/**
 * #### Concept Edit Action
 * The row's add control: a bleed icon button with a tooltip naming what it does.
 *
 * It used to switch on an `action` of `'add' | 'remove'`. Removal moved into the
 * row's overflow menu, where a destructive action is not one stray click from
 * the surface, and the `'remove'` arm was left behind unreachable. A prop whose
 * only job is to pick between one option is not worth keeping for a second
 * control that does not exist yet; whatever joins this one can generalize it
 * then, knowing what it actually needs.
 */
export const ConceptEditAction = ({handler}: {handler: () => void}) => {
  return (
    <Tooltip
      delay={{open: 750}}
      content={
        <Box padding={1} sizing="content">
          <Text muted size={1}>
            {MESSAGE}
          </Text>
        </Box>
      }
      fallbackPlacements={['right', 'left']}
      placement="top"
    >
      <Button
        icon={AddCircleIcon}
        mode={'bleed'}
        onClick={handler}
        tone={'positive'}
        aria-label={MESSAGE}
      />
    </Tooltip>
  )
}
