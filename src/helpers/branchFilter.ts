type BranchOptions = {
  schemeId: string
  branchId: string
}

type BranchFilterResult = {
  filter: string
  params: BranchOptions
}

/**
 * Document Branch Filter
 *
 * A pluggable Function for Filtering to a Top Concept Branch within a SKOS Concept Scheme
 * @param schemeId - The unique six character concept identifier for the Concept Scheme to which you wish to filter.
 * @param branchId - The unique six character concept identifier of a branch. Child concepts will be returned.
 * @returns A reference type filter for the child concepts of the designated branch in the selected Concept Scheme
 */
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
