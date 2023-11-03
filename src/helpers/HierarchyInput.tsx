import {Grid, Stack, Button, Dialog, Box} from '@sanity/ui'
import {useState, useEffect, useCallback} from 'react'
import {ObjectFieldProps, useClient, useFormValue} from 'sanity'
import {TreeView} from '../components/TreeView'

/**
 * Hierarchy View Input Component for Reference Fields
 * @todo check for scheme or branch filters — it only works if they're used; alternatively
 * provide optional parameters if a custom filter is used?
 */
export function HierarchyInput(props: ObjectFieldProps) {
  const {name, title} = props // name of the field to input a value
  const documentId = useFormValue(['_id']) as string // the resource document we're in

  const client = useClient({apiVersion: '2021-10-21'})
  const [open, setOpen] = useState(false)
  const [scheme, setScheme] = useState({}) // the skosConceptScheme document identified by the field filter options

  // get the filter options from the `reference` field
  // TODO: allow optional parameters to be passed into the input for cases where the provided
  // scheme/branch filters aren't in use.
  const {filter} = props.schemaType.options
  const filterValues = filter()
  const {schemeId, branchId = null} = filterValues.params // only schemes using the branchFilter() will have a branchId

  // get the skosConceptScheme document identified by the field filter options
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
   * Term Select Action
   * Writes the selected taxonomy term to the document field
   * @todo If this is a brand new document, _id is not yet in the content lake and this
   * will throw an error. Not a high frequency use case, but consider handling.
   */
  const handleAction = useCallback(
    (conceptRef: any) => {
      // if there is a draft document, patch the new reference and commit the change
      if (documentId.includes('drafts.')) {
        client
          .patch(documentId)
          .set({[name]: conceptRef})
          .commit()
          .then(() => setOpen(false))
          .catch((err) => console.error(err))
        return
      }
      // if there is not draft document, fetch the published version and create a new
      // document with the published document id in the `drafts.` path and the new
      // reference
      client
        .fetch(`*[_id == "${documentId}"][0]`)
        .then((res) => {
          res._id = `drafts.${res._id}`
          res[name] = conceptRef
          client.create(res)
        })
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
        <Dialog
          header={title}
          id="concept-select-dialog"
          onClose={handleClose}
          zOffset={900}
          width={1}
        >
          <Box padding={10}>
            <TreeView
              document={scheme} // the document.displayed _id for the relevant skosConceptScheme
              branchId={branchId} // the branch identified in branchFilter()
              inputComponent // boolean
              selectConcept={handleAction}
            />
          </Box>
        </Dialog>
      )}
    </Stack>
  )
}
