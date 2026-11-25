import type {DocumentConcepts} from '../../types'

/**
 * #### Drop Missing Concepts
 * Close the holes a deleted concept leaves in a scheme's tree.
 *
 * A concept added from the tree view is referenced **weakly** until it is
 * published — `planCreateConcept` writes `_weak: true` with
 * `_strengthenOnPublish`, because a brand-new concept exists only as a draft.
 * A weak reference does not block deletion, so a concept can be deleted while
 * the scheme still lists it, and `concepts[]->` then returns a `null` where the
 * document used to be. Every walk over the tree read straight through that
 * null, and the one that reached it first took the view down with it.
 *
 * `trunkBuilder` and `inputBuilder` now filter the dangling references out
 * themselves (`concepts[defined(@->)]->`), which is where the fix belongs: the
 * null never leaves the Content Lake. This is the second line, and it earns its
 * place by being the one the component tests can reach — they inject a tree
 * through `FakeDataPort` and never run a query at all. It also means a future
 * edit to those builders cannot quietly restore a crash that took the whole
 * Taxonomy tool out, reload included.
 *
 * Only the two root arrays are swept. They are the only place a null can
 * appear: `childConcepts` comes from `*[…]`, a filter, which returns the
 * documents it matched and so cannot produce one.
 *
 * Pure: returns a new tree only when something was dropped, and the **same
 * reference** otherwise. The tree is a `useMemo` dependency all the way down,
 * and a fresh object on every listener tick would recompute every walk under it.
 */
export function dropMissingConcepts(data: DocumentConcepts | null): DocumentConcepts | null {
  if (!data) return data

  const topConcepts = withoutHoles(data.topConcepts)
  const concepts = withoutHoles(data.concepts)
  if (topConcepts === data.topConcepts && concepts === data.concepts) return data

  return {...data, topConcepts, concepts}
}

/** The same array when it holds no holes, so an untouched tree keeps its identity. */
function withoutHoles<T extends readonly unknown[] | null | undefined>(nodes: T): T {
  if (!nodes || !nodes.some((node) => node === null || node === undefined)) return nodes
  // Generic in the whole array type, not its element: the two lists have
  // different element types, and both declare themselves non-nullable — which
  // is the promise being repaired here. The cast only restores the caller's own
  // type, which `filter` widens; it cannot change what the array holds.
  return nodes.filter((node) => node !== null && node !== undefined) as unknown as T
}
