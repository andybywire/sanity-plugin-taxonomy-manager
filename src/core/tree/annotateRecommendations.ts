import {getPublishedId, type DocumentId} from '@sanity/id-utils'

import type {ChildConceptTerm} from '../../types'

/**
 * Recursively annotate hierarchy nodes: mark a node `recommended` when its published
 * id is in the recommendation set, and set `hasMatchingDescendant` when any descendant
 * is recommended. Children are processed first so the flag propagates up the ancestor
 * chain. Pure: returns new nodes and never mutates the input.
 */
export function annotateRecommendations<T extends ChildConceptTerm>(
  node: T,
  recommendedIds: Set<string>
): T {
  const recommended = recommendedIds.has(getPublishedId(node.id as DocumentId))

  const annotatedChildren = node.childConcepts?.map((child) =>
    annotateRecommendations(child, recommendedIds)
  )

  const hasMatchingDescendant =
    annotatedChildren?.some((child) => child.recommended || child.hasMatchingDescendant) ?? false

  return {
    ...node,
    ...(recommended ? {recommended: true} : {}),
    ...(hasMatchingDescendant ? {hasMatchingDescendant: true} : {}),
    ...(annotatedChildren ? {childConcepts: annotatedChildren} : {}),
  } as T
}
