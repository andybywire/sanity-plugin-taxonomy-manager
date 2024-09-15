import {useCallback, useState} from 'react'
import {Card, Label, Stack, Text, Button, Dialog, Box, TextArea, TextInput} from '@sanity/ui'
import {AddIcon} from '@sanity/icons'
import {useAddTitle} from '../../hooks'
import {InlineHelp} from '../../styles'
import {SanityDocument} from 'sanity'

/**
 * #### New Concept Scheme Guide
 * - Prompts adding title and description to new concept scheme.
 * - Data must be saved to newly created Concept Scheme documents before
 *  add top concept / add concept buttons will work.
 */
export const NewScheme = ({document}: {document: SanityDocument}) => {
  const [open, setOpen] = useState(false)
  const [titleValue, setTitleValue] = useState('')
  const [descriptionValue, setDescriptionValue] = useState('')
  const onClose = useCallback(() => setOpen(false), [])
  const onOpen = useCallback(() => setOpen(true), [])

  const handleTitleChange = useCallback((event: any) => {
    setTitleValue(event.currentTarget.value)
  }, [])
  const handleDescriptionChange = useCallback((event: any) => {
    setDescriptionValue(event.currentTarget.value)
  }, [])

  const addTitle = useAddTitle()

  const handleAddTitle = useCallback(() => {
    addTitle(document, titleValue, descriptionValue)
  }, [addTitle, descriptionValue, document, titleValue])

  return (
    <InlineHelp>
      <Card padding={[3, 3, 4]} radius={2} shadow={1} tone="primary">
        <Stack space={6}>
          <Stack space={4}>
            <Label size={4}>New Concept Scheme</Label>
            <Text size={2}>
              To start using hierarchy view taxonomy builder, first give your concept scheme a name
              and optional description. You can also use the "Editor" tab to add concepts to the
              tree manually.
            </Text>
          </Stack>
          <Button tone="primary" fontSize={2} icon={AddIcon} onClick={onOpen} text="Add Title" />
        </Stack>
      </Card>
      {open && (
        <Dialog
          header="Title & Description"
          id="title-description"
          onClose={onClose}
          zOffset={1000}
          width={1}
        >
          <Box padding={4}>
            <Stack space={4}>
              <Stack space={2}>
                <Label size={1}>Title</Label>
                <Text size={1} muted>
                  Describe the concept scheme in one or two words.
                </Text>
              </Stack>
              <TextInput
                fontSize={2}
                onChange={handleTitleChange}
                padding={3}
                placeholder=""
                value={titleValue}
              />
              <Stack space={2}>
                <Label size={1}>Description (optional)</Label>
                <Text size={1} muted>
                  Describe the intended use of this concept scheme.
                </Text>
              </Stack>
              <TextArea
                fontSize={2}
                onChange={handleDescriptionChange}
                padding={3}
                placeholder=""
                value={descriptionValue}
                rows={3}
              />
              <Button tone="primary" fontSize={2} onClick={handleAddTitle} text="Save" />
            </Stack>
          </Box>
        </Dialog>
      )}
    </InlineHelp>
  )
}
