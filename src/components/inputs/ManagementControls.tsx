import {useCallback} from 'react'
import {unset} from 'sanity'
import {Button, Inline, Stack, useToast} from '@sanity/ui'

/**
 * #### Input Component for Deprecated Management Controls Field
 * The Management Controls field was used for a previous version
 * of the plugin and was set by default when creating a new scheme.
 * It has been set to "Deprecated." This control will allow users
 * to delete the value from the input to hide the field, without
 * otherwise seeing an error int their schema.
 * - Input is only visible if no identifier has been assigned
 * - Input disappears once an ID is generated
 */
export const ManagementControls = (props: any) => {
  const {onChange} = props
  const toast = useToast()

  const handleChange = useCallback(() => {
    onChange(unset())
    toast.push({
      status: 'success',
      title: 'Value removed.',
      duration: 2500,
      closable: true,
    })
  }, [onChange, toast])

  return (
    <Stack space={2}>
      <Inline space={[3, 3, 4]}>
        {props.renderDefault(props)}
        <Button tone="primary" fontSize={2} onClick={handleChange} text="Remove Value" />
      </Inline>
    </Stack>
  )
}
