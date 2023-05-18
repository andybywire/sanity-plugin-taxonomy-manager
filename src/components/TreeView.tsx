/**
 * Tree View
 * This is the view component for the hierarchy tree. It is passed
 * into Desk structure and is used to render the primary view for
 * taxonomy documents.
 */

import {useClient} from 'sanity'
import {Container, Stack, Box, Text, Inline, Button, useToast} from '@sanity/ui'
import {AddIcon} from '@sanity/icons'
import Hierarchy from './Hierarchy'
import {useCallback} from 'react'
import {randomKey} from '@sanity/util/content'
import {useOpenNewConceptPane} from '../hooks/useOpenNewConceptPane'

// Need to pass into this component:
// - documentId with draft status ✔︎
// - baseUri ✔︎
// – show new concepts in draft mode (and note that they need to be published)
// - update tree when new concepts (draft) are published
// - properly type the document that's passed in
// - add 'unpublished' badge to newly added concepts not yet published
// - disable add concept at 5th level; add info icon and tooltip message (or AccessDeniedIcon)
// - on delete (RemoveCircleIcon), remove from tree and add message in toast: "Concept removed from concept scheme, but not deleted from your concept store. [View Concept] to delete or modify"

export const TreeView = ({document}: {document: any}) => {
  const documentId = document.displayed._id
  const schemaBaseIri = document.displayed.baseIri

  // console.log(document)

  const client = useClient({apiVersion: '2021-10-21'})
  const toast = useToast()

  const openInNewPane = useOpenNewConceptPane()

  const createConcept = useCallback(
    (conceptType: string) => {
      const skosConcept = {
        _id: `sc-${randomKey(6)}`,
        _type: 'skosConcept',
        prefLabel: '',
        baseIri: schemaBaseIri,
        broader: [],
        related: [],
      }

      toast.push({
        closable: true,
        status: 'info',
        title: 'Creating top concept',
        description: 'This message is just a test.',
      })

      client
        .transaction()
        .create(skosConcept)
        // .patch(draftDoc)
        // .set({testValue: true})
        // .patch(draftDoc, (patch) => patch.set({testValue: topConcept._id}))
        .patch(documentId, (patch) => {
          if (conceptType == 'topConcept') {
            return patch
              .setIfMissing({topConcepts: []})
              .insert('after', 'topConcepts[-1]', [{_ref: skosConcept._id, _type: 'reference'}])
          }
          return patch
            .setIfMissing({concepts: []})
            .insert('after', 'concepts[-1]', [{_ref: skosConcept._id, _type: 'reference'}])
        })
        .commit({autoGenerateArrayKeys: true})
        .then((res) => {
          toast.push({
            closable: true,
            status: 'success',
            title: 'Top concept created',
            description: `Top concept created.`,
          })
          openInNewPane(res.documentIds[0])
        })
        .catch((err) => {
          toast.push({
            closable: true,
            status: 'error',
            title: 'Error creating top concept',
            description: err.message,
          })
        })
    },
    [schemaBaseIri, toast, client, documentId, openInNewPane]
  )

  const createTopConcept = useCallback(() => {
    createConcept('topConcept')
  }, [createConcept])

  const createEntryConcept = useCallback(() => {
    createConcept('concept')
  }, [createConcept])

  return (
    <Container width={1} style={{paddingTop: '1.25rem'}}>
      <Box padding={4}>
        <Stack space={4}>
          <Stack space={2}>
            <Text size={1} weight="semibold">
              Hierarchy Tree
            </Text>
            <Text size={1} muted>
              Concept hierarchy is determined by 'Broader' relationships assigned to each concept.
            </Text>
          </Stack>
          <Inline space={3}>
            {/* TBD where expand | collapse go. — SelectIcon/TruncateIcon */}
            {/* Convenience buttons are visible when a toggle is enabled — "Show editor controls in hierarchy view" */}
            {/* "Show controls" defaults to on; on publish there is a hint to turn them off — ideally a dialogue on the publish action, if not maybe a question and live edit on the toast message. */}
            {/* Hierarchy view then is description, hierarchy label and description, hierarchy view controls, hierarchy, then [+ top concept] | [+ concept] below. With a view toggle for the hierarchy view, maybe "remove" doesn't need to be hidden. Just show a confirm when it's clicked. */}
            <Button
              tone="primary"
              fontSize={1}
              icon={AddIcon}
              onClick={createTopConcept}
              text="Top Concept"
            />
            <Button
              tone="primary"
              fontSize={1}
              icon={AddIcon}
              onClick={createEntryConcept}
              text="Concept"
            />
          </Inline>
          <Hierarchy documentId={documentId} />
        </Stack>
      </Box>
    </Container>
  )
}

export default TreeView
