import {getPublishedId, type DocumentId} from '@sanity/id-utils'

/**
 * The slice of Studio's router pane state this module reads. Declared
 * structurally rather than imported from `sanity/structure`, so the core stays
 * free of Studio imports; `RouterPaneSibling` is assignable to it.
 */
type PaneSibling = {id: string; params?: Record<string, string | undefined>}

/**
 * #### Active Concept Id
 * The concept whose document is open in the pane group to the right of the
 * tree, normalized to a published id. `undefined` when nothing is open there.
 *
 * Reads only the first sibling of that group: the tree opens a single pane, so
 * in a split group the further siblings aren't ours to track.
 *
 * The pane's `params.type` is deliberately not checked. Document ids are unique
 * within a dataset, so an id match is already a type match, while panes reached
 * by other routes don't always carry the param — testing it could only suppress
 * a correct highlight.
 *
 * Pure: reads its arguments and returns a string or undefined.
 */
export function activeConceptId(
  panes: readonly (readonly PaneSibling[])[],
  groupIndex: number,
): string | undefined {
  const paneId = panes[groupIndex + 1]?.[0]?.id
  // Presence first: `getPublishedId` throws on a bare `drafts.` / `versions.x.`
  // prefix, so it must never see a missing id.
  if (!paneId) return undefined
  return getPublishedId(paneId as DocumentId)
}

/**
 * #### Is Active Concept
 * Whether a hierarchy node is the concept open in the adjacent pane.
 *
 * Both sides are normalized. A concept created from the tree opens as
 * `drafts.<uuid>` (see `deriveNewConceptId`), while node ids come back
 * published from the perspective-applied query — so the newly created concept,
 * the one the user is most likely to be looking for, only matches once both
 * sides are reduced to published ids.
 *
 * A concept with more than one broader term renders at several points in the
 * tree and every one of them matches. That is intended: each is that concept,
 * and the router carries no path to tell them apart.
 *
 * Pure: reads its arguments and returns a boolean.
 */
export function isActiveConcept(nodeId: string | undefined, activeId: string | undefined): boolean {
  if (!nodeId || !activeId) return false
  return getPublishedId(nodeId as DocumentId) === activeId
}
