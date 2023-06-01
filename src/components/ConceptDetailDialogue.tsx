/**
 * Information Icon and Dialogue with Concept Details
 * Affords Tree View access to Definition, Examples, and Scope Notes
 */

import {useCallback, useState} from 'react'
import {Dialog, Box, Text} from '@sanity/ui'
import {InfoOutlineIcon} from '@sanity/icons'
import {InfoDialog} from '../styles'

export const ConceptDetailDialogue = (concept) => {
  const [open, setOpen] = useState(false)
  const onClose = useCallback(() => setOpen(false), [])
  const onOpen = useCallback(() => setOpen(true), [])

  return (
    <InfoDialog>
      <InfoOutlineIcon className="brand" onClick={onOpen} />

      {open && (
        <Dialog header="Example" id="dialog-example" onClose={onClose} zOffset={1000}>
          <Box padding={4}>
            <Text>Content</Text>
          </Box>
        </Dialog>
      )}
    </InfoDialog>
  )
}
