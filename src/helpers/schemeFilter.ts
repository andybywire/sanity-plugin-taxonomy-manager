import type {useClient} from 'sanity'

type SchemeOptions = {
  schemeId: string
  expanded?: boolean
  browseOnly?: boolean
}

type SchemeFilterResult = {
  filter: string
  params: {
    schemeId: string
    concepts: string[]
    topConcepts: string[]
  }
  expanded?: boolean
  browseOnly?: boolean
}

/**
 * #### Reference Field Scheme Filter
 * Pluggable Function for Filtering to a Single SKOS Concept Scheme.
 * @param {string} schemeId - The unique six character concept identifier for
 *   the Concept Scheme to which you wish to filter.
 * @param {boolean} [expanded] - Set to `true` to display open hierarchy trees for
 *   input components. Input component trees load closed by default.
 * @param {boolean} [browseOnly] - Set to `true` to hide the default Sanity search
 *   input and display only the "Browse Taxonomy Tree" button for selecting terms.
 * @returns A reference type filter for Concepts and Top Concepts in
 *   the selected Concept Scheme test
 * @example
 * ```ts
 * import { schemeFilter } from 'sanity-plugin-taxonomy-manager'
 * ...
 * {
 *   name: 'test',
 *   type: 'array',
 *   of: [
 *     {
 *       type: 'reference',
 *       to: {type: 'skosConcept'},
 *       options: {
 *         filter: schemeFilter({
 *            schemeId: 'a1b2c3',
 *            expanded: true, // optional; defaults to false (closed tree)
 *            browseOnly: true, // optional; hides search input
 *          }),
 *         disableNew: true,
 *       },
 *     },
 *   ],
 * }
 * ```
 */
export const schemeFilter = (
  options: SchemeOptions
): (({
  getClient,
}: {
  getClient: (clientOptions: {apiVersion: string}) => ReturnType<typeof useClient>
}) => Promise<SchemeFilterResult>) => {
  // Get and validate the schemeId from options
  const {schemeId} = options || {}

  if (!schemeId || typeof schemeId !== 'string') {
    throw new Error('Invalid or missing schemeId: scheme Id must be a string')
  }

  return async (props) => {
    const client = props?.getClient({apiVersion: '2025-02-19'})
    if (!client) {
      throw new Error('Client not available')
    }
    // Fetch concepts and topConcepts for the given schemeId
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unnecessary-type-assertion
    const {concepts, topConcepts} = (await client.fetch(
      `{
      "concepts": *[_type=="skosConceptScheme" && schemeId == "${schemeId}"].concepts[]._ref,
      "topConcepts": *[_type=="skosConceptScheme" && schemeId == "${schemeId}"].topConcepts[]._ref
    }`
    )) as {concepts: string[]; topConcepts: string[]}
    // schemeId is included in params for use by the ArrayHierarchyInput component
    return {
      filter: `(_id in $concepts
              || _id in $topConcepts)`,
      params: {concepts, topConcepts, schemeId},
      expanded: options?.expanded,
      browseOnly: options?.browseOnly,
    }
  }
}
