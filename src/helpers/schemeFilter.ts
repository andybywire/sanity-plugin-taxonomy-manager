type SchemeOptions = {
  schemeId: string
}

type SchemeFilterResult = {
  filter: string
  params: SchemeOptions
}

/**
 * Document Scheme Filter
 *
 * Pluggable Function for Filtering to a Single SKOS Concept Scheme
 * @param schemeId - The unique six character concept identifier for the Concept Scheme to which you wish to filter.
 * @returns A reference type filter for Concepts and Top Concepts in the selected Concept Scheme
 */
export function schemeFilter(options: SchemeOptions): SchemeFilterResult {
  const {schemeId} = options || {}
  return {
    filter: `!(_id in path("drafts.**"))
    && _id in *[_type=="skosConceptScheme" && schemeId == $schemeId].concepts[]._ref
    || _id in *[_type=="skosConceptScheme" && schemeId == $schemeId].topConcepts[]._ref`,
    params: {
      schemeId: schemeId,
    },
  }
}
