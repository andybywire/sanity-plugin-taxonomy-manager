import {useCallback, useState} from 'react'
import {Dialog, Box, Text, Stack, Label} from '@sanity/ui'
import {InfoOutlineIcon} from '@sanity/icons'
import {StyledTreeButton} from '../../styles'
import {useLinkColorScheme} from '../../hooks/useLinkColorScheme'

/**
 * #### Information Icon and Dialogue with Concept Details
 * - affords Tree View access to Definition, Examples, and Scope Notes
 * - is rendered only when concept details are present
 */
export const ConceptDetailDialogue = ({concept}: {concept: any}) => {
  const [open, setOpen] = useState(false)
  const onClose = useCallback(() => setOpen(false), [])
  const onOpen = useCallback(() => setOpen(true), [])

  const linkColor = useLinkColorScheme()

  if (!concept || (!concept.definition && !concept.example && !concept.scopeNote)) return null

  return (
    <>
      <StyledTreeButton className="action" aria-label="info" onClick={onOpen} type="button">
        <InfoOutlineIcon className="info" style={{color: linkColor}} />
      </StyledTreeButton>

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
            </Stack>
          </Box>
        </Dialog>
      )}
    </>
  )
}
