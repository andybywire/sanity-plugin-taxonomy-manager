import {GenerateIcon} from '@sanity/icons'
import {Button, Stack, useToast} from '@sanity/ui'
import {useCallback} from 'react'
import {set} from 'sanity'
import type {StringInputProps} from 'sanity'

import {createId} from '../../helpers/createId'
import type {Options} from '../../types'

type IdentifierProps = StringInputProps & {
  ident?: Options['ident']
}

/**
 * #### Create Unique Identifier
 * For schemes and concepts created in previous versions of the
 * plugin.
 * - Input is only visible if no identifier has been assigned
 * - Input disappears once an ID is generated
 */
export const Identifier = (props: IdentifierProps) => {
  const {onChange, ident} = props
  const toast = useToast()

  const handleChange = useCallback(() => {
    const id = createId(ident)
    onChange(set(id))
    toast.push({
      status: 'success',
      title: 'Identifier created.',
      closable: true,
    })
  }, [onChange, toast, ident])

  return (
    <Stack space={2}>
      <Button
        icon={GenerateIcon}
        mode="ghost"
        fontSize={1}
        width="fill"
        onClick={handleChange}
        text="Generate identifier"
      />
    </Stack>
  )
}

Identifier.defaultProps = {
  ident: undefined,
}
