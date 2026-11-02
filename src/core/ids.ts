import {
  DocumentId,
  getDraftId,
  getPublishedId,
  getVersionId,
  getVersionNameFromId,
  isPublishedId,
  isVersionId,
  type VersionId,
} from '@sanity/id-utils'

/** The `_strengthenOnPublish` template applied to weak skosConcept references. */
export const SKOS_CONCEPT_STRENGTHEN = {type: 'skosConcept', template: {id: 'skosConcept'}} as const

export type SchemeMutationTarget = {
  isInRelease: boolean
  releaseName: string | undefined
  schemeId: string
  /** The scheme's published id — the Actions API `publishedId`. */
  publishedId: string
}

/**
 * Resolve the document id a scheme mutation should write to, from the displayed
 * scheme id: the matching version id when the scheme is being edited inside a
 * release, otherwise its draft id. Shared by every concept mutation.
 *
 * Studio sets `displayed._id` from the selected perspective, so it already
 * names the version **before any version document exists** — verified against a
 * real release. That is what makes this derivation sufficient on its own.
 */
export function deriveSchemeMutationTarget(displayedId: string): SchemeMutationTarget {
  const docId = DocumentId(displayedId)
  const isInRelease = isVersionId(docId)
  const releaseName = isInRelease ? getVersionNameFromId(docId as VersionId) : undefined
  const schemeId = isInRelease ? getVersionId(docId, releaseName as string) : getDraftId(docId)
  return {isInRelease, releaseName, schemeId, publishedId: getPublishedId(docId)}
}

/**
 * The id for a newly created concept, in the same release/draft context as its
 * scheme. `uuid` is supplied by the caller (kept pure/deterministic here).
 */
export function deriveNewConceptId(
  uuid: string,
  context: {isInRelease: boolean; releaseName: string | undefined},
): string {
  const docId = DocumentId(uuid)
  return context.isInRelease
    ? getVersionId(docId, context.releaseName as string)
    : getDraftId(docId)
}

export type ReferenceStrength = {
  _weak: boolean
  _strengthenOnPublish?: typeof SKOS_CONCEPT_STRENGTHEN
}

/**
 * Weak-reference flags for a reference to a concept that may not be published
 * yet. When the referenced concept is a draft or version (not published), the
 * reference must be weak and strengthened on publish so it survives until the
 * target is published.
 */
export function conceptReferenceStrength(referencedOriginalId: string): ReferenceStrength {
  const published = isPublishedId(DocumentId(referencedOriginalId))
  return published ? {_weak: false} : {_weak: true, _strengthenOnPublish: SKOS_CONCEPT_STRENGTHEN}
}
