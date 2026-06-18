import {getPublishedId, type DocumentId} from '@sanity/id-utils'

import type {ChildConceptTerm} from '../../types'

/**
 * Recursively annotate hierarchy nodes with their embeddings `score` (from a
 * lookup map keyed by published id) and `hasMatchingDescendant` when any
 * descendant scored. Children are processed first so the flag propagates up the
 * ancestor chain. Pure: returns new nodes and never mutates the input.
 */
export function annotateScores<T extends ChildConceptTerm>(node: T, scores: Map<string, number>): T {
  const publishedId = getPublishedId(node.id as DocumentId)
  const score = scores.get(publishedId)

  const annotatedChildren = node.childConcepts?.map((child) => annotateScores(child, scores))

  const hasMatchingDescendant =
    annotatedChildren?.some((child) => child.score !== undefined || child.hasMatchingDescendant) ??
    false

  return {
    ...node,
    ...(score === undefined ? {} : {score}),
    ...(hasMatchingDescendant ? {hasMatchingDescendant: true} : {}),
    ...(annotatedChildren ? {childConcepts: annotatedChildren} : {}),
  } as T
}
