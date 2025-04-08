import {
  Grid,
  Stack,
  Button,
  Dialog,
  Box,
  Card,
  Label,
  Text,
  useToast,
  Flex,
  Spinner,
} from '@sanity/ui'
import {useState, useEffect, useCallback} from 'react'
import {ArrayFieldProps, useClient, useFormValue} from 'sanity'
import {TreeView} from '../TreeView'

/**
 * Hierarchy View Input Component
 *
 * This component allows Studio users to browse and select taxonomy
 * terms from a hierarchical tree structure. It is designed to be
 * used as an input for taxonomy array fields in Sanity Studio.
 *
 * Hierarchy view must be used in conjunction with the Taxonomy Manager
 * plugin `schemeFilter` or `branchFilter` options.
 *
 */
export function ArrayHierarchyInput(props: ArrayFieldProps) {
  const {name, title, value = []} = props // name of the field to input a value
  const documentId = useFormValue(['_id']) as string
  // the resource document we're in
  const client = useClient({apiVersion: '2021-10-21'})

  const [schemeLoading, setSchemeLoading] = useState(true)
  const [valuesLoading, setValuesLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [scheme, setScheme] = useState({})
  // the skosConceptScheme document identified by the field filter options
  const [filterValues, setFilterValues] = useState<any>(null)
  // State to store resolved filter values

  // get the filter options from the `reference` field
  const {schemeId, branchId = null} = filterValues?.params || {} // use filterValues if available, otherwise fallback to default

  const {filter} = props.schemaType.of[0].options

  const toast = useToast()

  // Fetch filter values from `reference` filed filter asynchronously
  useEffect(() => {
    async function fetchFilterValues() {
      try {
        const resolvedFilterValues = await filter({getClient: () => client})
        setFilterValues(resolvedFilterValues)
        // Store the resolved filter values in state
        setValuesLoading(false)
      } catch (error) {
        console.error('Error fetching filter values: ', error)
      }
    }
    fetchFilterValues()
  }, [filter, client])

  // get the skosConceptScheme document identified by the field
  // filter options
  useEffect(() => {
    client
      .fetch(`{"displayed": *[schemeId == "${schemeId}"][0]}`)
      .then((res) => {
        if (res?.displayed) {
          setScheme(res)
          setSchemeLoading(false)
        }
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
   * #### Term Select Action
   * Writes the selected taxonomy term to the array field
   */
  const handleAction = useCallback(
    (conceptRef: any) => {
      // If the ref of the selected term is already in the field close the dialog
      // and provide a toast message that tht entry is already in the field.
      if (value && value.map((item: any) => item._ref).includes(conceptRef._ref)) {
        setOpen(false)
        toast.push({
          status: 'warning',
          title: 'Taxonomy Term Not Added',
          description: 'The selected concept is already included in this field.',
          duration: 5000,
          closable: true,
        })
        return
      }
      // if there is a draft document, patch the new reference and
      // commit the change
      if (documentId.includes('drafts.')) {
        client
          .patch(documentId)
          .setIfMissing({[name]: []})
          .append(name, [conceptRef])
          .commit({autoGenerateArrayKeys: true})
          .then(() => setOpen(false))
          .catch((err) => console.error(err))
        return
      }
      // if there is not a draft document, fetch the published
      // version and create a new document with the published
      // document id in the `drafts.` path and the new reference
      client
        .fetch(`*[_id == "${documentId}"][0]`)
        .then((res) => {
          res._id = `drafts.${res._id}`
          client.create(res)
        })
        .then(() => {
          client
            .patch(`drafts.${documentId}`)
            .setIfMissing({[name]: []})
            .append(name, [conceptRef])
            .commit({autoGenerateArrayKeys: true})
            .then(() => setOpen(false))
            .catch((err) => console.error(err))
        })
        .catch((err) => console.error(err))
    },
    [client, documentId, name, value, toast]
  )

  // Check to be sure a filter is present
  if (!props.schemaType.of[0].options?.filter) {
    return (
      <Stack space={3}>
        {props.renderDefault(props)}
        <Box padding={4}>
          <Card padding={[3]} radius={2} shadow={1} tone="caution">
            <Text size={1}>
              The <code>ArrayHierarchyInput()</code> component must be used with an accompanying{' '}
              <code>schemeFilter()</code> or <code>branchFilter()</code>. Please add an appropriate
              filter to the configuration for the {title} field.
            </Text>
          </Card>
        </Box>
      </Stack>
    )
  }
  // ... and that it is a scheme or branch filter and configured correctly
  else if (props.schemaType.of[0].options.filter.length == 0) {
    return (
      <Stack space={3}>
        {props.renderDefault(props)}
        <Box padding={4}>
          <Card padding={[3]} radius={2} shadow={1} tone="caution">
            <Text size={1}>
              There was a problem loading your filter settings. Please check the{' '}
              <code>schemeFilter()</code> or <code>branchFilter()</code> configuration for the{' '}
              {title} field.
            </Text>
          </Card>
        </Box>
      </Stack>
    )
  }
  // Check to see if array uses more than one schema and bail with a notification if more than one is detected.
  else if (props.schemaType.of.length > 1) {
    return (
      <Stack space={3}>
        {props.renderDefault(props)}
        <Card padding={[3]} radius={2} shadow={1} tone="caution">
          <Stack space={4}>
            <Stack space={2}>
              <Label size={2}>Input Component Not Supported for Multi-Schema Arrays</Label>
              <Text size={1}>
                The Sanity Taxonomy Manager Hierarchy Input Component is not designed to support
                array inputs with more than one schema type. Please see the{' '}
                <a href="https://sanitytaxonomymanager.com">Taxonomy Manager docs</a> for more
                information.
              </Text>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    )
  } else if (schemeLoading || valuesLoading) {
    return (
      <Box padding={5}>
        <Flex
          align="center"
          direction="column"
          gap={5}
          height="fill"
          justify="center"
          style={{paddingTop: '1rem'}}
        >
          <Spinner muted />
          <Text muted size={1}>
            Loading input component…
          </Text>
        </Flex>
      </Box>
    )
  }
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
              inputComponent
              selectConcept={handleAction}
            />
          </Box>
        </Dialog>
      )}
    </Stack>
  )
}
