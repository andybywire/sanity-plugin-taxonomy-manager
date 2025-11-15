import {InfoOutlineIcon, ErrorOutlineIcon} from '@sanity/icons'
import {Dialog, Box, Text, Button, Tooltip} from '@sanity/ui'
import {useCallback, useState} from 'react'

/**
 * #### Information Icon and Dialogue with Structure Details
 * Provide feedback on concepts that are at the limit of
 * or have children beyond the supported hierarchy depth
 */
export const StructureDetailDialogue = ({
  message,
  title,
  type,
}: {
  message: string
  title: string
  type: 'info' | 'warn' | 'error'
}) => {
  const [open, setOpen] = useState(false)
  const onClose = useCallback(() => setOpen(false), [])
  const onOpen = useCallback(() => setOpen(true), [])

  const toneMap = {
    info: 'default' as const,
    warn: 'caution' as const,
    error: 'critical' as const,
  }

  return (
    <>
      <Tooltip
        delay={{open: 750}}
        content={
          <Box padding={1} sizing="content">
            <Text muted size={1}>
              Taxonomy Manager structure notice
            </Text>
          </Box>
        }
        fallbackPlacements={['right', 'left']}
        placement="top"
      >
        <Button
          icon={type == 'error' ? ErrorOutlineIcon : InfoOutlineIcon}
          mode={'bleed'}
          onClick={onOpen}
          tone={toneMap[type]}
        />
      </Tooltip>

      {open && (
        <Dialog header={title} id="dialog-example" onClose={onClose} zOffset={1000} width={1}>
          <Box padding={4} paddingBottom={5}>
            <Text>{message}</Text>
          </Box>
        </Dialog>
      )}
    </>
  )
}
