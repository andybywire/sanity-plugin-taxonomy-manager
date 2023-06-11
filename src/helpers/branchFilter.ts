/**
 * Pluggable Function for Filtering to a Top Concept Branch within a SKOS Concept Scheme
 */

type BranchOptions = {
  schemeId: string
  branchId: string
}

type BranchFilterResult = {
  filter: string
  params: BranchOptions
}

export function branchFilter(options: BranchOptions): BranchFilterResult {
  const {schemeId, branchId} = options || {}
  return {
    filter: `!(_id in path("drafts.**")) && _id in *[_type=="skosConceptScheme" && schemeId == $schemeId].concepts[]._ref 
               && $branchId in broader[]->conceptId
               || $branchId in broader[]->broader[]->conceptId
               || $branchId in broader[]->broader[]->broader[]->conceptId
               || $branchId in broader[]->broader[]->broader[]->broader[]->conceptId
               || $branchId in broader[]->broader[]->broader[]->broader[]->broader[]->conceptId`,
    params: {
      schemeId,
      branchId,
    },
  }
}
