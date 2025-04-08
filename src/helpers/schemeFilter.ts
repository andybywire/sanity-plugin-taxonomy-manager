type SchemeOptions = {
  schemeId: string
}

type SchemeFilterResult = {
  filter: string
  params: {
    concepts: string[]
    topConcepts: string[]
  }
}

/**
 * #### Reference Field Scheme Filter
 * Pluggable Function for Filtering to a Single SKOS Concept Scheme
 * @param schemeId - The unique six character concept identifier for
 *   the Concept Scheme to which you wish to filter.
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
 *         filter: schemeFilter({schemeId: 'a1b2c3'}),
 *         disableNew: true,
 *       },
 *     },
 *   ],
 * }
 * ```
 */
export const schemeFilter = (
  options: SchemeOptions
): (({getClient}: {getClient: Function}) => Promise<SchemeFilterResult>) => {
  // Get and validate the schemeId from options
  const {schemeId} = options || {}
  if (!schemeId || typeof schemeId !== 'string') {
    throw new Error('Invalid or missing schemeId: scheme Id must be a string')
  }

  return async (props) => {
    const client = props?.getClient({apiVersion: '2023-01-01'})
    if (!client) {
      throw new Error('Client not available')
    }
    // Fetch concepts and topConcepts for the given schemeId
    const {concepts, topConcepts} = await client.fetch(
      `{
      "concepts": *[_type=="skosConceptScheme" && schemeId == "${schemeId}"].concepts[]._ref,
      "topConcepts": *[_type=="skosConceptScheme" && schemeId == "${schemeId}"].topConcepts[]._ref
    }`
    )
    // schemeId is included in params for use by the ArrayHierarchyInput component
    return {
      filter: `!(_id in path("drafts.**"))
              && (_id in $concepts
              || _id in $topConcepts)`,
      params: {concepts, topConcepts, schemeId},
    }
  }
}
