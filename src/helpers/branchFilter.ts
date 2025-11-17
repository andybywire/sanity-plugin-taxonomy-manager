import type {useClient} from 'sanity'

type BranchOptions = {
  schemeId: string
  branchId: string
  expanded?: boolean
}

type BranchFilterResult = {
  filter: string
  params: {
    schemeId: string
    branchId: string
    concepts: string[]
  }
  expanded?: boolean
}

/**
 * #### Reference Field Scheme & Branch Filter
 * A pluggable Function for Filtering to a Top Concept Branch within a SKOS Concept Scheme
 * @param {string} schemeId - The unique six character concept identifier for
 *   the Concept Scheme to which you wish to filter.
 * @param {string} branchId - The unique six character concept identifier of
 *   a branch. Child concepts will be returned.
 * @param {boolean} [expanded] - Set to `true` to display open hierarchy trees for
 *   input components. Input component trees load closed by default.
 * @returns A reference type filter for the child concepts of the designated branch in the selected Concept Scheme
 * @example
 * ```ts
 * import { branchFilter } from 'sanity-plugin-taxonomy-manager'
 * ...
 * {
 *   name: 'test',
 *   type: 'array',
 *   of: [
 *     {
 *       type: 'reference',
 *       to: {type: 'skosConcept'},
 *       options: {
 *         filter: branchFilter({
 *            schemeId: 'a1b2c3',
 *            branchId: 'd4e5f6'
 *            expanded: true, // optional; defaults to false (closed tree)
 *        }),
 *         disableNew: true,
 *       },
 *     },
 *   ],
 * }
 * ```
 */
export const branchFilter = (
  options: BranchOptions
): (({
  getClient,
}: {
  getClient: (clientOptions: {apiVersion: string}) => ReturnType<typeof useClient>
}) => Promise<BranchFilterResult>) => {
  const {schemeId, branchId = null} = options || {}

  if (!schemeId || typeof schemeId !== 'string') {
    throw new Error('Invalid or missing schemeId: scheme Id must be a string')
  }

  if (!branchId || typeof branchId !== 'string') {
    throw new Error('Invalid or missing branchId: branch Id must be a string')
  }

  return async (props) => {
    const client = props?.getClient({apiVersion: '2023-01-01'})
    if (!client) {
      throw new Error('Client not available')
    }

    // Fetch concepts for the given schemeId and branchId
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unnecessary-type-assertion
    const {concepts} = (await client.fetch(
      `{      
        "concepts": *[
          _id in *[_type=="skosConceptScheme" && schemeId == $schemeId].concepts[]._ref
            && ($branchId in broader[]->conceptId
              || $branchId in broader[]->broader[]->conceptId
              || $branchId in broader[]->broader[]->broader[]->conceptId
              || $branchId in broader[]->broader[]->broader[]->broader[]->conceptId
              || $branchId in broader[]->broader[]->broader[]->broader[]->broader[]->conceptId)
          ]._id
      }`,
      {schemeId, branchId}
    )) as {concepts: string[]}
    // schemeId is included in params for use by the ArrayHierarchyInput component
    return {
      filter: `_id in $concepts`,
      params: {concepts, schemeId, branchId},
      expanded: options?.expanded,
    }
  }
}
