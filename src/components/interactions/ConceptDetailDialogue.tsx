import {InfoOutlineIcon} from '@sanity/icons'
import {Dialog, Box, Text, Stack, Label, Button, Tooltip} from '@sanity/ui'
import {useCallback, useState} from 'react'

import type {ChildConceptTerm, TopConceptTerm} from '../../types'

const MessageHelper = ({title, message}: {title: string; message: string}) => {
  return (
    <Stack space={2}>
      <Label size={1}>{title}</Label>
      <Text size={2} muted style={{whiteSpace: 'pre-wrap'}}>
        {message}
      </Text>
    </Stack>
  )
}

/**
 * #### Information Icon and Dialogue with Concept Details
 * - Affords Tree View access to Definition, Examples, and Scope Notes
 * - Rendered only when concept details are present
 */
export const ConceptDetailDialogue = ({
  concept,
}: {
  concept: (ChildConceptTerm | TopConceptTerm) & {
    definition?: string
    example?: string
    scopeNote?: string
  }
}) => {
  const [open, setOpen] = useState(false)
  const onClose = useCallback(() => setOpen(false), [])
  const onOpen = useCallback(() => setOpen(true), [])

  if (!concept || (!concept.definition && !concept.example && !concept.scopeNote)) return null

  return (
    <>
      <Tooltip
        delay={{open: 750}}
        content={
          <Box padding={1} sizing="content">
            <Text muted size={1}>
              View concept details
            </Text>
          </Box>
        }
        fallbackPlacements={['right', 'left']}
        placement="top"
      >
        <Button icon={InfoOutlineIcon} mode={'bleed'} onClick={onOpen} tone={'default'} />
      </Tooltip>

      {open && (
        <Dialog
          header={concept.prefLabel}
          id="dialog-example"
          onClose={onClose}
          zOffset={1000}
          width={1}
        >
          <Box padding={4} paddingTop={2} paddingBottom={5}>
            <Stack space={4}>
              {concept.definition && (
                <MessageHelper title={'Definition'} message={concept.definition} />
              )}
              {concept.example && <MessageHelper title={'Examples'} message={concept.example} />}
              {concept.scopeNote && (
                <MessageHelper title={'Scope Notes'} message={concept.scopeNote} />
              )}
            </Stack>
          </Box>
        </Dialog>
      )}
    </>
  )
}
