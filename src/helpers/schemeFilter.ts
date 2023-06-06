/**
 * Pluggable Function for Filtering to a Single SKOS Concept Scheme
 */

type SchemeFilterResult = {
  filter: string
  params: {
    schemeId: string
  }
}
type Options = {
  schemeId: string
}

export function schemeFilter(options: Options): SchemeFilterResult {
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
