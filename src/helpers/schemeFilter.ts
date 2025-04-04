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
 * #### Document Scheme Filter
 * Pluggable Function for Filtering to a Single SKOS Concept Scheme
 * @param schemeId - The unique six character concept identifier for the Concept Scheme to which you wish to filter.
 * @returns A reference type filter for Concepts and Top Concepts in the selected Concept Scheme
 */
export function schemeFilter(
  tmOptions: SchemeOptions
): ({
  getClient,
}: {
  getClient: (options: {apiVersion: string}) => any
}) => Promise<SchemeFilterResult> {
  const {schemeId} = tmOptions || {}
  if (!schemeId || typeof schemeId !== 'string') {
    throw new Error('Invalid or missing schemeId: scheme Id must be a string')
  }
  return async ({
    getClient,
  }: {
    getClient: (options: {apiVersion: string}) => any
  }): Promise<SchemeFilterResult> => {
    const client = getClient({apiVersion: '2023-01-01'})
    const {concepts, topConcepts} = await client.fetch(
      `{
        "concepts": *[_type=="skosConceptScheme" && schemeId == "${schemeId}"].concepts[]._ref,
        "topConcepts": *[_type=="skosConceptScheme" && schemeId == "${schemeId}"].topConcepts[]._ref
      }`
    )
    return {
      filter: `!(_id in path("drafts.**"))
      && _id in $concepts
      || _id in topConcepts`,
      params: {concepts, topConcepts},
    }
  }
}
