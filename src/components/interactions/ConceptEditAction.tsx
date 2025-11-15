import {TrashIcon, AddCircleIcon} from '@sanity/icons'
import {Box, Text, Button, Tooltip} from '@sanity/ui'
// import {useCallback, useState} from 'react'

export const ConceptEditAction = ({
  action,
  handler,
}: {
  action: 'remove' | 'add'
  handler: () => void
}) => {
  // const [open, setOpen] = useState(false)
  // const onClose = useCallback(() => setOpen(false), [])
  // const onOpen = useCallback(() => setOpen(true), [])

  const typeMap = {
    add: {
      message: 'Add a child concept below this concept' as const,
      icon: AddCircleIcon,
      tone: 'positive' as const,
    },
    remove: {
      message: 'Remove this concept from this scheme' as const,
      icon: TrashIcon,
      tone: 'critical' as const,
    },
  }

  return (
    <Tooltip
      delay={{open: 750}}
      content={
        <Box padding={1} sizing="content">
          <Text muted size={1}>
            {typeMap[action].message}
          </Text>
        </Box>
      }
      fallbackPlacements={['right', 'left']}
      placement="top"
    >
      <Button
        icon={typeMap[action].icon}
        mode={'bleed'}
        onClick={handler}
        tone={typeMap[action].tone}
        aria-label="Remove this concept from this scheme"
      />
    </Tooltip>
  )
}
