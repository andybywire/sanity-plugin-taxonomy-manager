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
  else if (!concept.definition && !concept.example && !concept.scopeNote) {
    return null

    // To Investigate: Showing disabled icons in the absence of explanatory notes.
    // The goal is to encourage editors to provide descriptions, but the better
    // practice is likely simply not to show the icon if there is no content there.
    // For the moment, defaulting to showing no icon.

    // return (
    //   <InfoDialog>
    //     <Tooltip
    //       content={
    //         <Box padding={2} sizing="border">
    //           <Stack padding={1} space={2}>
    //             <Text muted size={1}>
    //               This concept has no explanatory notes.
    //             </Text>
    //           </Stack>
    //         </Box>
    //       }
    //       fallbackPlacements={['right', 'left']}
    //       placement="top"
    //     >
    //       <InfoOutlineIcon className="default" />
    //     </Tooltip>
    //   </InfoDialog>
    // )
  }

  return (
    <InfoDialog>
      <InfoOutlineIcon className="brand" onClick={onOpen} />

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
