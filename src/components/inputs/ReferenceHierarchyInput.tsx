/* eslint-disable react/require-default-props */
import {isVersionId} from '@sanity/id-utils'
import type {DocumentId} from '@sanity/id-utils'
import {Grid, Stack, Button, Dialog, Box, Spinner, Text, Flex, Card} from '@sanity/ui'
import {useState, useEffect, useCallback} from 'react'
import type {ObjectFieldProps, ObjectOptions, Reference} from 'sanity'
import {isDraftId, useClient, useFormValue, usePerspective} from 'sanity'

import {useEmbeddingsRecs} from '../../hooks'
import NodeTree from '../../static/NodeTree'
import type {ConceptSchemeDocument, EmbeddingsIndexConfig} from '../../types'
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
  embeddingsIndex?: EmbeddingsIndexConfig
}

// Extract the return type of the filter function
type FilterResult = Awaited<ReturnType<ReferenceOptions['filter']>>

/**
 * Input component that replaces Sanity's default reference field input with a
 * hierarchical taxonomy tree browser. Studio users can browse taxonomy terms
 * organized in their scheme hierarchy and select a single term for the field.
 *
 * @remarks
 * - Must be used with a `schemeFilter` or `branchFilter` helper in the field's
 *   `options.filter`. Rendering without a filter will display a configuration warning.
 * - Taxonomy selection is disabled when viewing the published perspective.
 * - When `browseOnly` is set in the filter configuration, Sanity's default search input
 *   is suppressed and only the tree browser is available for term selection.
 * - When `expanded` is set in the filter configuration, the hierarchy tree loads open
 *   by default instead of collapsed.
 *
 * @param props - Standard Sanity `ObjectFieldProps<Reference>` extended with an optional
 *   `embeddingsIndex` configuration object.
 * @param props.embeddingsIndex - Optional configuration for AI-assisted term
 *   recommendations via a Sanity Embeddings Index. When provided, opening the tree
 *   browser queries the specified index and annotates matching taxonomy terms with
 *   a relevance score to help authors identify the most appropriate term.
 * @param props.embeddingsIndex.indexName - The name of the Sanity Embeddings Index
 *   to query. Must be an index that includes `skosConcept` documents.
 * @param props.embeddingsIndex.fieldReferences - An array of field names from the
 *   current document whose values are concatenated and sent as the embeddings search
 *   query. All listed fields must contain values when the tree browser is opened;
 *   empty fields will display an error message in the tree view rather than scores.
 * @param props.embeddingsIndex.maxResults - Maximum number of semantically matching
 *   terms to return from the embeddings index. Defaults to `3`.
 *
 * @example
 * Basic usage with a scheme filter:
 * ```js
 * import {ReferenceHierarchyInput, schemeFilter} from 'sanity-plugin-taxonomy-manager'
 *
 * defineField({
 *   name: 'gradeLevel',
 *   title: 'Grade Level',
 *   type: 'reference',
 *   to: {type: 'skosConcept'},
 *   options: {
 *     filter: schemeFilter({schemeId: 'f3deba'}),
 *     disableNew: true,
 *   },
 *   components: {field: ReferenceHierarchyInput},
 * })
 * ```
 *
 * @example
 * Branch filter with tree expanded by default:
 * ```js
 * import {ReferenceHierarchyInput, branchFilter} from 'sanity-plugin-taxonomy-manager'
 *
 * defineField({
 *   name: 'topics',
 *   title: 'Topics',
 *   type: 'reference',
 *   to: {type: 'skosConcept'},
 *   options: {
 *     filter: branchFilter({schemeId: 'cf76c1', branchId: '1e5e6c', expanded: true}),
 *     disableNew: true,
 *   },
 *   components: {field: ReferenceHierarchyInput},
 * })
 * ```
 *
 * @example
 * Browse-only mode (suppresses the default Sanity search input):
 * ```js
 * import {ReferenceHierarchyInput, branchFilter} from 'sanity-plugin-taxonomy-manager'
 *
 * defineField({
 *   name: 'topics',
 *   title: 'Topics',
 *   type: 'reference',
 *   to: {type: 'skosConcept'},
 *   options: {
 *     filter: branchFilter({schemeId: 'cf76c1', branchId: '1e5e6c', browseOnly: true}),
 *     disableNew: true,
 *   },
 *   components: {field: ReferenceHierarchyInput},
 * })
 * ```
 *
 * @example
 * AI-assisted recommendations via an embeddings index:
 * ```jsx
 * import {ReferenceHierarchyInput, schemeFilter} from 'sanity-plugin-taxonomy-manager'
 *
 * defineField({
 *   name: 'topics',
 *   title: 'Topics',
 *   type: 'reference',
 *   to: [{type: 'skosConcept'}],
 *   options: {
 *     filter: schemeFilter({schemeId: 'f3deba'}),
 *     disableNew: true,
 *   },
 *   components: {
 *     field: (props) => (
 *       <ReferenceHierarchyInput
 *         {...props}
 *         embeddingsIndex={{
 *           indexName: 'my-taxonomy-index',
 *           fieldReferences: ['title', 'metaDescription'],
 *           maxResults: 4,
 *         }}
 *       />
 *     ),
 *   },
 * })
 * ```
 *
 * @see {@link ArrayHierarchyInput} for multi-value `array` fields
 * @see {@link schemeFilter} for filtering by a full concept scheme
 * @see {@link branchFilter} for filtering by a branch within a concept scheme
 */
export function ReferenceHierarchyInput(props: HierarchyInput) {
  const client = useClient({apiVersion: 'vX'})

  // the resource document in which the input component appears:
  const documentId = useFormValue(['_id']) as string

  // name of the field to input a value
  const {name, title, value, embeddingsIndex} = props

  const {conceptRecs, recsError, triggerEmbeddingsSearch} = useEmbeddingsRecs(embeddingsIndex)

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
    triggerEmbeddingsSearch()
  }, [triggerEmbeddingsSearch])

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
