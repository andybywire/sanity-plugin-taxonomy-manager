import {DocumentId, isDraftId} from '@sanity/id-utils'

import type {ChildConceptTerm, DocumentConcepts} from '../types'

/**
 * One glyph beside a row: the caution ring for a draft, the positive dot for a
 * published version. Named for what they mean, not what they look like — the
 * drawing lives in `components/interactions/ConceptStatusMarkers`.
 */
export type ConceptStatusMarker = 'draft' | 'published'

// The four outcomes, shared rather than rebuilt per call, so a row can render
// the result without it changing identity on every pass.
const DRAFT_AND_PUBLISHED: readonly ConceptStatusMarker[] = Object.freeze([
  'draft',
  'published',
] as const)
const PUBLISHED_ONLY: readonly ConceptStatusMarker[] = Object.freeze(['published'] as const)
const DRAFT_ONLY: readonly ConceptStatusMarker[] = Object.freeze(['draft'] as const)
const NEITHER: readonly ConceptStatusMarker[] = Object.freeze([] as const)

/**
 * #### Has Draft Version
 * Whether the version of a concept on screen is a draft.
 *
 * The tree is queried through the drafts perspective, which normalizes `_id` to
 * the published id and leaves the document actually read in `_originalId` — so
 * a `drafts.` prefix there is the whole fact, and no extra query is needed to
 * learn it. `conceptReferenceStrength` already reads the field this way.
 *
 * `isDraftId` rather than `!isPublishedId`: a release version is neither draft
 * nor published, and the negation would file it under drafts.
 *
 * Presence is guarded because `DocumentId` throws on an empty string; a bare
 * `drafts.` prefix would throw too, but ids come from the Content Lake, which
 * never emits one.
 *
 * Pure: reads its argument and returns a boolean.
 */
export function hasDraftVersion(originalId: string | undefined): boolean {
  if (!originalId) return false
  return isDraftId(DocumentId(originalId))
}

/**
 * #### Concept Status Markers
 * Which glyphs a row shows, in the order they are drawn.
 *
 * This is Studio's own rule for the default perspective, from
 * `resolveDocumentStatusIcons` in the `sanity` bundle: draft before published,
 * and nothing at all when neither version exists. Reproduced rather than
 * imported — the function is `@internal`, and the icons it draws with are
 * marked temporary in Studio's own source.
 *
 * Pure: reads its argument and returns one of four shared arrays.
 */
export function conceptStatusMarkers({
  hasDraft,
  hasPublished,
}: {
  hasDraft: boolean
  hasPublished: boolean
}): readonly ConceptStatusMarker[] {
  if (hasDraft && hasPublished) return DRAFT_AND_PUBLISHED
  if (hasPublished) return PUBLISHED_ONLY
  if (hasDraft) return DRAFT_ONLY
  return NEITHER
}

/**
 * #### Collect Draft Concept Ids
 * The concepts in a tree whose displayed version is a draft.
 *
 * These are the only ones worth asking the published query about. A node whose
 * `_originalId` is not a draft *is* the published document — the drafts
 * perspective returned it, and it had no draft to prefer — so its published
 * status is already known and a query about it would be dead weight.
 *
 * Deduplicated: a concept with more than one broader term appears at several
 * points in the tree, and is one document in all of them.
 *
 * Pure: reads its argument and returns a new Set.
 */
export function collectDraftConceptIds(data: DocumentConcepts | null): Set<string> {
  const ids = new Set<string>()
  const walk = (concepts: ChildConceptTerm[] | undefined): void => {
    if (!concepts) return
    for (const concept of concepts) {
      if (hasDraftVersion(concept._originalId)) ids.add(concept.id)
      walk(concept.childConcepts)
    }
  }
  if (data) {
    walk(data.topConcepts)
    walk(data.concepts)
  }
  return ids
}
