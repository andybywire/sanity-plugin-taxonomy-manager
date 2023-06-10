/**
 * Information Icon and Dialogue with Concept Details
 * Affords Tree View access to Definition, Examples, and Scope Notes
 */

import {useCallback, useState} from 'react'
import {Dialog, Box, Text, Stack, Label} from '@sanity/ui'
import {InfoOutlineIcon} from '@sanity/icons'
import {InfoDialog} from '../styles'

export const ConceptDetailDialogue = ({concept}: {concept: any}) => {
  const [open, setOpen] = useState(false)
  const onClose = useCallback(() => setOpen(false), [])
  const onOpen = useCallback(() => setOpen(true), [])

  if (!concept) return null

  return (
    <InfoDialog>
      <button onClick={onOpen} type="button">
        <InfoOutlineIcon className="brand info" />
      </button>

      {open && (
        <Dialog
          header={concept.prefLabel}
          id="dialog-example"
          onClose={onClose}
          zOffset={1000}
          width={1}
        >
          <Box padding={4} paddingBottom={5}>
            <Stack space={4}>
              {concept.definition && (
                <Stack space={2}>
                  <Label size={1}>Definition</Label>
                  <Text size={2} muted style={{whiteSpace: 'pre-wrap'}}>
                    {concept.definition}
                  </Text>
                </Stack>
              )}
              {concept.example && (
                <Stack space={2}>
                  <Label size={1}>Example</Label>
                  <Text size={2} muted style={{whiteSpace: 'pre-wrap'}}>
                    {concept.example}
                  </Text>
                </Stack>
              )}
              {concept.scopeNote && (
                <Stack space={2}>
                  <Label size={1}>Scope Note</Label>
                  <Text size={2} muted style={{whiteSpace: 'pre-wrap'}}>
                    {concept.scopeNote}
                  </Text>
                </Stack>
              )}
              {/* <pre>{JSON.stringify(concept, null, 2)}</pre> */}
            </Stack>
          </Box>
        </Dialog>
      )}
    </InfoDialog>
  )
}
