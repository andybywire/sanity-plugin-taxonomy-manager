/**
 * Pure halves of the reference-field filters. The public `schemeFilter` /
 * `branchFilter` factories (in ../helpers) keep the impure GROQ fetch; the
 * validation and result-assembly below are pure and unit-tested here.
 */

export type SchemeFilterResult = {
  filter: string
  params: {schemeId: string; concepts: string[]; topConcepts: string[]}
  expanded?: boolean
  browseOnly?: boolean
}

export type BranchFilterResult = {
  filter: string
  params: {schemeId: string; branchId: string; concepts: string[]}
  expanded?: boolean
  browseOnly?: boolean
}

/** Throws if the scheme id is missing or not a string. */
export function assertSchemeId(schemeId: unknown): asserts schemeId is string {
  if (!schemeId || typeof schemeId !== 'string') {
    throw new Error('Invalid or missing schemeId: scheme Id must be a string')
  }
}

/** Throws if the branch id is missing or not a string. */
export function assertBranchId(branchId: unknown): asserts branchId is string {
  if (!branchId || typeof branchId !== 'string') {
    throw new Error('Invalid or missing branchId: branch Id must be a string')
  }
}

/** Assemble the scheme reference-filter result from the fetched concept refs. */
export function buildSchemeFilterResult(input: {
  schemeId: string
  concepts: string[]
  topConcepts: string[]
  expanded?: boolean
  browseOnly?: boolean
}): SchemeFilterResult {
  const {schemeId, concepts, topConcepts, expanded, browseOnly} = input
  return {
    filter: `(_id in $concepts
              || _id in $topConcepts)`,
    params: {concepts, topConcepts, schemeId},
    expanded,
    browseOnly,
  }
}

/** Assemble the branch reference-filter result from the fetched concept refs. */
export function buildBranchFilterResult(input: {
  schemeId: string
  branchId: string
  concepts: string[]
  expanded?: boolean
  browseOnly?: boolean
}): BranchFilterResult {
  const {schemeId, branchId, concepts, expanded, browseOnly} = input
  return {
    filter: `_id in $concepts`,
    params: {concepts, schemeId, branchId},
    expanded,
    browseOnly,
  }
}
