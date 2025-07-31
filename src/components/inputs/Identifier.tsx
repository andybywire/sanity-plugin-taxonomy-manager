import {Button, Inline, Stack, useToast} from '@sanity/ui'
import {nanoid} from 'nanoid'
import {useCallback} from 'react'
import {set} from 'sanity'
import type {StringInputProps} from 'sanity'

/**
 * #### Create Unique Identifier
 * For schemes and concepts created in previous versions of the
 * plugin.
 * - Input is only visible if no identifier has been assigned
 * - Input disappears once an ID is generated
 */
export const Identifier = (props: StringInputProps) => {
  const {onChange} = props
  const toast = useToast()

  const handleChange = useCallback(() => {
    onChange(set(nanoid(6)))
    toast.push({
      status: 'success',
      title: 'Identifier created.',
      closable: true,
    })
  }, [onChange, toast])

  return (
    <Stack space={2}>
      <Inline space={[3, 3, 4]}>
        <Button tone="primary" fontSize={2} onClick={handleChange} text="Generate Identifier" />
      </Inline>
    </Stack>
  )
}
