import {Grid, Stack, Button, Dialog, Box} from '@sanity/ui'
import {useState, useEffect, useCallback} from 'react'
import {useClient, useFormValue} from 'sanity'
import {TreeView} from '../components/TreeView'

export function HierarchyInput(props: any) {
  const {name} = props // name of the field to input a value
  const documentId = useFormValue(['_id']) as string // the resource document we're in

  const client = useClient({apiVersion: '2021-10-21'})
  const [open, setOpen] = useState(false)
  const [scheme, setScheme] = useState({})

  // get the filter options from the `reference` field
  const {filter} = props.schemaType.options
  const filterExec = filter()
  const {branchId, schemeId} = filterExec.params

  // get the skosConceptScheme identified by the field filter options
  useEffect(() => {
    client
      .fetch(`{"displayed": *[schemeId == "${schemeId}"][0]}`)
      .then((res) => {
        setScheme(res)
      })
      .catch((err) => console.warn(err))
  }, [client, schemeId])

  const browseHierarchy = useCallback(() => {
    setOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
  }, [])

  /**
   * @todo If this is a brand new document, _id is not yet in the content lake and this
   * will throw an error. Not a high frequency use case, but consider handling.
   */
  const handleAction = useCallback(
    (conceptRef: any) => {
      // if there is not draft document, create one first, then patch the new concept
      if (!documentId.includes('drafts.')) {
        client
          .fetch(`*[_id == "${documentId}"]`)
          .then((res) => {
            res[0]._id = `drafts.${res[0]._id}`
            res[0][name] = conceptRef
            client.create(res[0])
          })
          .then(() => setOpen(false))
          .catch((err) => console.error(err))
        return
      }
      // otherwise, just  patch the selected concept to the draft document
      client
        .patch(documentId)
        .set({[name]: conceptRef})
        .commit()
        .then(() => setOpen(false))
        .catch((err) => console.error(err))
    },
    [client, documentId, name]
  )

  return (
    <Stack space={3}>
      {props.renderDefault(props)}

      <Grid columns={1} gap={3}>
        <Button text="Browse Taxonomy Tree" mode="ghost" onClick={browseHierarchy} />
      </Grid>
      {open && (
        <Dialog header="Example" id="dialog-example" onClose={handleClose} zOffset={900} width={1}>
          <Box padding={10}>
            <TreeView
              document={scheme}
              branchId={branchId}
              inputComponent
              selectConcept={handleAction}
            />
          </Box>
        </Dialog>
      )}
    </Stack>
  )
}
