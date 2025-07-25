import {isVersionId} from '@sanity/id-utils'
import type {DocumentId} from '@sanity/id-utils'
import {Grid, Stack, Button, Dialog, Box, Spinner, Text, Flex, Card} from '@sanity/ui'
import {useState, useEffect, useCallback} from 'react'
import type {ObjectFieldProps, ObjectOptions, Reference} from 'sanity'
import {isDraftId, useClient, useFormValue, usePerspective} from 'sanity'

import type {ConceptSchemeDocument} from '../../types'
import {TreeView} from '../TreeView'

type ReferenceOptions = ObjectOptions & {
  filter: ({getClient}: {getClient: () => ReturnType<typeof useClient>}) => Promise<{
    filter: string
    params: {
      concepts: string[]
      topConcepts?: string[]
      schemeId: string
      branchId?: string
    }
  }>
}

// Extract the return type of the filter function
type FilterResult = Awaited<ReturnType<ReferenceOptions['filter']>>

/**
 * #### Hierarchy View Input Component for Reference Fields
 * Allows Studio users to browse and select taxonomy
 * terms from a hierarchical tree structure. It is designed to be
 * used as an input for taxonomy reference fields in Sanity Studio.
 *
 * Hierarchy view must be used in conjunction with the Taxonomy Manager
 * plugin `schemeFilter` or `branchFilter` options.
 */
export function ReferenceHierarchyInput(props: ObjectFieldProps<Reference>) {
  const client = useClient({apiVersion: '2025-02-19'})

  // the resource document in which the input component appears:
  const documentId = useFormValue(['_id']) as string
  // name of the field to input a value
  const {name, title} = props

  // Get release and draft status of the document
  const isInRelease = isVersionId(documentId as DocumentId)
  const isDraft = isDraftId(documentId as DocumentId)
  // Selected Perspective is also used in the Tree view component. Consider tidying.
  const {selectedPerspectiveName} = usePerspective()

  const [schemeLoading, setSchemeLoading] = useState(true)
  const [valuesLoading, setValuesLoading] = useState(true)
  const [open, setOpen] = useState(false)

  // the skosConceptScheme document identified by the field filter options:
  const [scheme, setScheme] = useState({})
  // State to store resolved filter values:
  const [filterValues, setFilterValues] = useState<FilterResult | undefined>()

  // use filterValues if available, otherwise fallback to default:
  const {schemeId, branchId = null} = filterValues?.params || {}

  const {filter} = props.schemaType.options as ReferenceOptions

  // Fetch filter values from `reference` field filter asynchronously.
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
    fetchFilterValues().catch((error) => console.error('Error fetching filter values: ', error))
  }, [filter, client])

  // get the skosConceptScheme document identified by the field filter options
  useEffect(() => {
    if (!schemeId) return
    client
      .fetch(`{"displayed": *[schemeId == "${schemeId}"][0]}`)
      .then((res: {displayed?: ConceptSchemeDocument['displayed']}) => {
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
   * Writes the selected taxonomy term to the document field
   */
  const handleAction = useCallback(
    (conceptId: {_ref: string; _type: 'reference'}) => {
      // if there is a draft document, patch the new reference and
      // commit the change
      if (isDraft || isInRelease) {
        client
          .patch(documentId)
          .set({[name]: conceptId})
          .commit()
          .then(() => setOpen(false))
          .catch((err) => console.error(err))
        return
      }
      // if there is not a draft document, fetch the published
      // version and create a new document with the published
      // document id in the `drafts.` path and the new reference
      client
        .fetch(`*[_id == "${documentId}"][0]`)
        .then((res: ConceptSchemeDocument) => {
          res._id = `drafts.${res._id}`
          res[name] = conceptId
          client.create(res).catch((error) => console.error('Error creating draft: ', error))
        })
        .then(() => setOpen(false))
        .catch((err) => console.error(err))
    },
    [client, documentId, isDraft, isInRelease, name]
  )

  // Check to be sure a filter is present
  if (!(props.schemaType.options as ReferenceOptions)?.filter) {
    return (
      <Stack space={3}>
        {props.renderDefault(props)}
        <Box padding={4}>
          <Card padding={[3]} radius={2} shadow={1} tone="caution">
            <Text size={1}>
              The <code>ReferenceHierarchyInput()</code> component must be used with an accompanying{' '}
              <code>schemeFilter()</code> or <code>branchFilter()</code>. Please add an appropriate
              filter to the configuration for the {title} field.
            </Text>
          </Card>
        </Box>
      </Stack>
    )
  }
  // ... and that it is a scheme or branch filter and configured correctly
  else if ((props.schemaType.options as ReferenceOptions)?.filter.length === 0) {
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
        <Button
          disabled={selectedPerspectiveName === 'published'}
          text="Browse Taxonomy Tree"
          mode="ghost"
          onClick={browseHierarchy}
        />
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
              document={scheme as ConceptSchemeDocument}
              // @ts-expect-error - TODO: work out this type issue.
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
