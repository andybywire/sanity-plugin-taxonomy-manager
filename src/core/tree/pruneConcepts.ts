import type {ChildConceptTerm, DocumentConcepts} from '../../types'

type ConceptNodeList = readonly {id: string; childConcepts?: ChildConceptTerm[]}[] | undefined

/**
 * Recursively remove every concept whose `id` is in `removedIds` from a concept
 * tree — top concepts, orphan/concepts, and all nested `childConcepts`. Returns
 * a new tree without mutating the input; passes `null` and an empty removal set
 * through unchanged (same reference).
 *
 * Used by the optimistic-removal layer in `Hierarchy`: a concept unset from a
 * scheme disappears tree-wide (the trunk query gates every node on scheme
 * membership), so pruning by id mirrors what the live listener will eventually
 * return — letting the tree update instantly instead of waiting on the refetch.
 */
export function pruneConcepts(
  data: DocumentConcepts | null,
  removedIds: ReadonlySet<string>
): DocumentConcepts | null {
  if (!data || removedIds.size === 0) return data
  return {
    ...data,
    topConcepts: (data.topConcepts ?? [])
      .filter((concept) => !removedIds.has(concept.id))
      .map((concept) =>
        concept.childConcepts
          ? {...concept, childConcepts: pruneChildren(concept.childConcepts, removedIds)}
          : concept
      ),
    concepts: (data.concepts ?? [])
      .filter((concept) => !removedIds.has(concept.id))
      .map((concept) =>
        concept.childConcepts
          ? {...concept, childConcepts: pruneChildren(concept.childConcepts, removedIds)}
          : concept
      ),
  }
}

function pruneChildren(
  children: ChildConceptTerm[],
  removedIds: ReadonlySet<string>
): ChildConceptTerm[] {
  return children
    .filter((concept) => !removedIds.has(concept.id))
    .map((concept) =>
      concept.childConcepts
        ? {...concept, childConcepts: pruneChildren(concept.childConcepts, removedIds)}
        : concept
    )
}

/**
 * Collect every concept `id` present anywhere in the tree (top, orphan, and all
 * nested children). Used to reconcile the optimistic removal set against fresh
 * listener data — once an id is gone from the data, it can be forgotten.
 */
export function collectConceptIds(data: DocumentConcepts | null): Set<string> {
  const ids = new Set<string>()
  const walk = (concepts: ConceptNodeList): void => {
    if (!concepts) return
    for (const concept of concepts) {
      ids.add(concept.id)
      walk(concept.childConcepts)
    }
  }
  if (data) {
    walk(data.topConcepts)
    walk(data.concepts)
  }
  return ids
}
