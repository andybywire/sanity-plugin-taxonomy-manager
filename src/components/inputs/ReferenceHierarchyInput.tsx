import {isVersionId} from '@sanity/id-utils'
import type {DocumentId} from '@sanity/id-utils'
import {Grid, Stack, Button, Dialog, Box, Spinner, Text, Flex, Card} from '@sanity/ui'
import {useState, useEffect, useCallback} from 'react'
import type {ObjectFieldProps, ObjectOptions, Reference} from 'sanity'
import {
  isDraftId,
  useClient,
  useFormValue,
  usePerspective,
  useDataset,
  useGetFormValue,
} from 'sanity'

import NodeTree from '../../static/NodeTree'
import type {ConceptSchemeDocument, EmbeddingsResult} from '../../types'
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

type HierarchyInput = ObjectFieldProps<Reference> & {
  embeddingsIndex?: {
    indexName: string
    fieldReferences: string[]
    maxResults?: number
  }
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
export function ReferenceHierarchyInput(props: HierarchyInput) {
  const client = useClient({apiVersion: 'vX'})
  const dataset = useDataset()
  const getFormValue = useGetFormValue()

  // the resource document in which the input component appears:
  const documentId = useFormValue(['_id']) as string

  // name of the field to input a value
  const {name, title, value, embeddingsIndex} = props

  // Get release and draft status of the document
  const isInRelease = isVersionId(documentId as DocumentId)
  const isDraft = isDraftId(documentId as DocumentId)

  // Selected Perspective is also used in the Tree view component. Consider tidying.
  const {selectedPerspectiveName} = usePerspective()

  const [schemeLoading, setSchemeLoading] = useState(true)
  const [valuesLoading, setValuesLoading] = useState(true)
  const [open, setOpen] = useState(false)

  // the skosConceptScheme document identified by the field filter options:
  const [scheme, setScheme] = useState<ConceptSchemeDocument | undefined>(undefined)

  // State to store resolved filter values:
  const [filterValues, setFilterValues] = useState<FilterResult | undefined>()

  // use filterValues if available, otherwise fallback to default:
  const {schemeId, branchId = null} = filterValues?.params || {}

  const [conceptRecs, setConceptRecs] = useState<EmbeddingsResult[]>([])
  const [recsError, setRecsError] = useState<string | null>(null)

  const {filter} = props.schemaType.options as ReferenceOptions

  const buildQueryString = useCallback(
    (fieldReferences: string[]): string => {
      const emptyFields: string[] = []
      const values = fieldReferences.map((fieldName) => {
        const val = getFormValue([fieldName])
        if (typeof val === 'string' && val.trim() !== '') {
          return val
        }
        emptyFields.push(fieldName)
        return ''
      })
      if (emptyFields.length === 1) {
        throw new Error(`Please fill out the ${emptyFields[0]} field to enable match scores.`)
      } else if (emptyFields.length > 1) {
        throw new Error(
          `The following fields must be filled out to enable match scores: ${emptyFields.join(
            ', '
          )}`
        )
      }
      return values.filter(Boolean).join(' ')
    },
    [getFormValue]
  )

  const fetchConceptRecs = useCallback(
    async (query: string, indexName: string, maxResults: number) => {
      const returnedRecs: EmbeddingsResult[] = await client.request({
        url: `/embeddings-index/query/${dataset}/${indexName}`,
        method: 'POST',
        body: {
          query,
          maxResults,
        },
      })
      setConceptRecs(returnedRecs)
    },
    [client, dataset]
  )

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
      .fetch('{"displayed": *[schemeId == $schemeId][0]}', {schemeId})
      .then((res: {displayed?: ConceptSchemeDocument['displayed']}) => {
        if (res?.displayed) {
          setScheme(res as ConceptSchemeDocument)
          setSchemeLoading(false)
        }
      })
      .catch((err) => console.warn(err))
  }, [client, schemeId])

  const browseHierarchy = useCallback(() => {
    setOpen(true)
    setRecsError(null) // Clear any previous errors
    if (embeddingsIndex) {
      const {indexName, fieldReferences, maxResults = 3} = embeddingsIndex
      try {
        const query = buildQueryString(fieldReferences)

        fetchConceptRecs(query, indexName, maxResults).catch((error) =>
          console.error('Error with embeddings index fetch: ', error)
        )
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'One or more required fields are empty'
        setRecsError(errorMessage)
        // setOpen(true)
      }
    }
  }, [buildQueryString, embeddingsIndex, fetchConceptRecs])

  const handleClose = useCallback(() => {
    setOpen(false)
  }, [])

  /**
   * #### Term Select Action
   * Writes the selected taxonomy term to the document field
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
        isDraftId(conceptId?._originalId as DocumentId) ||
        isVersionId(conceptId?._originalId as DocumentId)
      ) {
        conceptId._strengthenOnPublish = {
          type: 'skosConcept',
          template: {id: 'skosConcept'},
        }
        conceptId._weak = true
      }

      delete conceptId._originalId

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
        .fetch('*[_id == $id][0]', {id: documentId})
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
  const isPublished = selectedPerspectiveName === 'published'

  // Render the browse-only preview UI
  const renderBrowseOnlyPreview = () => {
    if (value) {
      return props.renderDefault(props)
    }
    return (
      <Stack space={2}>
        <Box paddingY={3}>
          <Text size={1} weight={'medium'}>
            {title}
          </Text>
        </Box>
        <Card padding={3} radius={2} border>
          <Text muted align="center" size={1}>
            No items
          </Text>
        </Card>
      </Stack>
    )
  }

  return (
    <Stack space={4}>
      {filterValues?.browseOnly ? renderBrowseOnlyPreview() : props.renderDefault(props)}

      <Grid columns={1} gap={3}>
        <Button
          disabled={isPublished}
          icon={NodeTree}
          text="Browse taxonomy tree"
          mode="ghost"
          onClick={browseHierarchy}
        />
      </Grid>
      {open && scheme && (
        <Dialog
          header={title}
          id="concept-select-dialog"
          onClose={handleClose}
          zOffset={900}
          width={1}
        >
          <Box padding={10}>
            <TreeView
              document={scheme}
              branchId={branchId}
              inputComponent
              selectConcept={handleAction}
              expanded={filterValues?.expanded}
              conceptRecs={conceptRecs}
              recsError={recsError}
            />
          </Box>
        </Dialog>
      )}
    </Stack>
  )
}
