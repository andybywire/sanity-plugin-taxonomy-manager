import {CloseIcon} from '@sanity/icons'
import type {DocumentId} from '@sanity/id-utils'
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
import {AiOutlineTag} from 'react-icons/ai'
import type {ArrayFieldProps, ObjectOptions} from 'sanity'
import {useClient, useFormValue, isVersionId, isDraftId, usePerspective} from 'sanity'

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
    expanded?: boolean
    browseOnly?: boolean
  }>
}

// Extract the return type of the filter function
type FilterResult = Awaited<ReturnType<ReferenceOptions['filter']>>

/**
 * #### Hierarchy View Input Component
 * Allows Studio users to browse and select taxonomy
 * terms from a hierarchical tree structure. It is designed to be
 * used as an input for taxonomy array fields in Sanity Studio.
 *
 * Hierarchy view must be used in conjunction with the Taxonomy Manager
 * plugin `schemeFilter` or `branchFilter` options.
 *
 */
export function ArrayHierarchyInput(props: ArrayFieldProps) {
  const client = useClient({apiVersion: '2025-02-19'})

  // the resource document in which the input component appears:
  const documentId = useFormValue(['_id']) as string
  // name of the field to input a value:
  const {name, title, value = []} = props

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
  // State for browse-only mode: stores selected concepts' preview data
  const [selectedConcepts, setSelectedConcepts] = useState<
    Array<{_key: string; _ref: string; prefLabel: string}>
  >([])

  // use filterValues if available, otherwise fallback to default:
  const {schemeId, branchId = null} = filterValues?.params || {}

  const {filter} = props.schemaType.of[0].options as ReferenceOptions

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

  // Fetch selected concepts preview data for browse-only mode
  useEffect(() => {
    if (!filterValues?.browseOnly) return
    if (!value || value.length === 0) {
      setSelectedConcepts([])
      return
    }

    const typedValue = value as Array<{_key: string; _ref: string}>
    const refs = typedValue.map((item) => item._ref)
    client
      .fetch<Array<{_id: string; prefLabel: string}>>(
        `*[_id in $refs || _id in $draftRefs]{_id, prefLabel}`,
        {
          refs,
          draftRefs: refs.map((r) => `drafts.${r}`),
        }
      )
      .then((results) => {
        const conceptMap = new Map(results.map((r) => [r._id.replace('drafts.', ''), r]))
        setSelectedConcepts(
          typedValue.map((item) => ({
            _key: item._key,
            _ref: item._ref,
            prefLabel: conceptMap.get(item._ref)?.prefLabel || 'Unknown',
          }))
        )
      })
      .catch((err) => console.error('Error fetching selected concepts:', err))
  }, [value, filterValues?.browseOnly, client])

  const browseHierarchy = useCallback(() => {
    setOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
  }, [])

  /**
   * #### Remove Item Action (browse-only mode)
   * Removes a single taxonomy term from the array field by _key
   */
  const handleRemove = useCallback(
    (keyToRemove: string) => {
      if (isDraft || isInRelease) {
        client
          .patch(documentId)
          .unset([`${name}[_key=="${keyToRemove}"]`])
          .commit()
          .catch((err) => console.error('Error removing item:', err))
        return
      }
      // For published docs, create draft first then remove
      client
        .fetch(`*[_id == "${documentId}"][0]`)
        .then((res: {_id: string; _type: string; [key: string]: unknown}) => {
          res._id = `drafts.${res._id}`
          client
            .create(res)
            .then(() => {
              client
                .patch(`drafts.${documentId}`)
                .unset([`${name}[_key=="${keyToRemove}"]`])
                .commit()
            })
            .catch((error) => console.error('Error creating draft:', error))
        })
        .catch((err) => console.error('Error fetching document:', err))
    },
    [client, documentId, isDraft, isInRelease, name]
  )

  /**
   * #### Term Select Action
   * Writes the selected taxonomy term to the array field
   */
  const handleAction = useCallback(
    (conceptId: {
      _ref: string
      _type: 'reference'
      _originalId?: string
      _strengthenOnPublish?: {type: 'skosConcept'; template: {id: 'skosConcept'}}
      _weak?: boolean
    }) => {
      if (
        isDraftId(conceptId?._originalId as string) ||
        isVersionId(conceptId?._originalId as string)
      ) {
        conceptId._strengthenOnPublish = {
          type: 'skosConcept',
          template: {id: 'skosConcept'},
        }
        conceptId._weak = true
      }

      delete conceptId._originalId

      // If the ref of the selected term is already in the field close the dialog
      // and provide a toast message that tht entry is already in the field.
      if (value?.map((item: any) => item._ref).includes(conceptId._ref)) {
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
      if (isDraft || isInRelease) {
        client
          .patch(documentId)
          .setIfMissing({[name]: []})
          .append(name, [conceptId])
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
        .then((res: ConceptSchemeDocument) => {
          res._id = `drafts.${res._id}`
          client.create(res).catch((error) => console.error('Error creating draft: ', error))
        })
        .then(() => {
          client
            .patch(`drafts.${documentId}`)
            .setIfMissing({[name]: []})
            .append(name, [conceptId])
            .commit({autoGenerateArrayKeys: true})
            .then(() => setOpen(false))
            .catch((err) => console.error(err))
        })
        .catch((err) => console.error(err))
    },
    [value, isDraft, isInRelease, client, documentId, toast, name]
  )

  // Check to be sure a filter is present
  if (!(props.schemaType.of[0].options as ReferenceOptions)?.filter) {
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
  else if ((props.schemaType.of[0].options as ReferenceOptions)?.filter?.length === 0) {
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

  const isPublished = selectedPerspectiveName === 'published'

  // Render the browse-only preview UI for arrays
  const renderBrowseOnlyPreview = () => {
    if (selectedConcepts.length === 0) {
      return (
        <Card padding={3} radius={2} border tone="transparent">
          <Text muted size={1}>
            No terms selected
          </Text>
        </Card>
      )
    }

    return (
      <Stack space={2}>
        {selectedConcepts.map((concept) => (
          <Card key={concept._key} padding={3} radius={2} border>
            <Flex align="center" gap={3}>
              <Box>
                <Text size={2}>
                  <AiOutlineTag />
                </Text>
              </Box>
              <Box flex={1}>
                <Text size={1} weight="medium">
                  {concept.prefLabel}
                </Text>
              </Box>
              {!isPublished && (
                <Button
                  icon={CloseIcon}
                  mode="bleed"
                  tone="default"
                  onClick={() => handleRemove(concept._key)}
                  padding={2}
                  title="Remove"
                />
              )}
            </Flex>
          </Card>
        ))}
      </Stack>
    )
  }

  return (
    <Stack space={3}>
      {filterValues?.browseOnly ? renderBrowseOnlyPreview() : props.renderDefault(props)}

      <Grid columns={1} gap={3}>
        <Button
          disabled={isPublished}
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
          <Box>
            <TreeView
              document={scheme as ConceptSchemeDocument}
              // @ts-expect-error - TODO: work out this type issue.
              branchId={branchId}
              inputComponent
              selectConcept={handleAction}
              expanded={filterValues?.expanded}
            />
          </Box>
        </Dialog>
      )}
    </Stack>
  )
}
