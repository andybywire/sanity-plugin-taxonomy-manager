import {DocumentId, getPublishedId} from '@sanity/id-utils'

import type {ConceptSchemeDocument, SkosConceptDocument, SkosConceptReference} from '../types'

import {
  conceptReferenceStrength,
  deriveNewConceptId,
  deriveSchemeMutationTarget,
  SKOS_CONCEPT_STRENGTHEN,
} from './ids'

type SchemeDisplayed = ConceptSchemeDocument['displayed']

/**
 * "Describe, don't execute": the create/remove/move planners below compute a pure
 * description of the transaction a concept mutation should run. The hooks stay
 * thin — they generate the random ids/keys, pass them in, and replay the plan
 * onto client.transaction(). This makes the release/version-aware mutation logic
 * exhaustively unit-testable without a Studio.
 */

export type CreateConceptPlan = {
  kind: 'create'
  schemeId: string
  newConceptId: string
  createIfNotExists: SchemeDisplayed & {_id: string}
  create: SkosConceptDocument
  appendField: 'topConcepts' | 'concepts'
  reference: SkosConceptReference
}

export function planCreateConcept(input: {
  scheme: SchemeDisplayed
  conceptType: 'topConcept' | 'concept'
  broaderConcept?: {id: string; _originalId: string}
  newConceptUuid: string
  conceptId: string
  schemeBaseIri: string | undefined
  newConceptKey: string
  broaderKey: string
}): CreateConceptPlan {
  const target = deriveSchemeMutationTarget(input.scheme._id)
  const newConceptId = deriveNewConceptId(input.newConceptUuid, target)

  const create: SkosConceptDocument = {
    _id: newConceptId,
    _type: 'skosConcept',
    conceptId: input.conceptId,
    prefLabel: '',
    baseIri: input.schemeBaseIri,
    broader: [],
    related: [],
  }

  if (input.broaderConcept) {
    create.broader = [
      {
        _key: input.broaderKey,
        _ref: getPublishedId(DocumentId(input.broaderConcept.id)),
        _type: 'reference',
        ...conceptReferenceStrength(input.broaderConcept._originalId),
      },
    ]
  }

  const reference: SkosConceptReference = {
    _ref: getPublishedId(DocumentId(newConceptId)),
    _type: 'reference',
    _key: input.newConceptKey,
    _strengthenOnPublish: SKOS_CONCEPT_STRENGTHEN,
    _weak: true,
  }

  return {
    kind: 'create',
    schemeId: target.schemeId,
    newConceptId,
    createIfNotExists: {...input.scheme, _id: target.schemeId},
    create,
    appendField: input.conceptType === 'topConcept' ? 'topConcepts' : 'concepts',
    reference,
  }
}

export type RemoveConceptPlan = {
  kind: 'remove'
  schemeId: string
  createIfNotExists: SchemeDisplayed & {_id: string}
  unsetPaths: string[]
}

export function planRemoveConcept(input: {
  scheme: SchemeDisplayed
  conceptRef: string
  conceptType: string
}): RemoveConceptPlan {
  const field = input.conceptType === 'topConcept' ? 'topConcepts' : 'concepts'
  const {schemeId} = deriveSchemeMutationTarget(input.scheme._id)
  return {
    kind: 'remove',
    schemeId,
    createIfNotExists: {...input.scheme, _id: schemeId},
    unsetPaths: [`${field}[_ref=="${input.conceptRef}"]`],
  }
}

type MoveConceptBase = {
  scheme: SchemeDisplayed
  concept: {id: string}
  fromParentId: string
}

/**
 * Either a new broader term, which needs a `_key` for the reference, or none at
 * all. Keeping these as separate shapes means a caller cannot ask for a new
 * broader term and forget the key.
 */
export type MoveConceptInput =
  | (MoveConceptBase & {toParent: {id: string; _originalId?: string}; broaderKey: string})
  | (MoveConceptBase & {toParent: null})

export type MoveConceptPlan = {
  kind: 'move'
  /** Published id of the moved concept — the Actions API `publishedId`. */
  publishedId: string
  /** The draft, or release version, the patch is applied to. */
  targetId: string
  /** True when `targetId` names a release version rather than a draft. */
  isInRelease: boolean
  /** Path unsetting the reference to the concept's former broader term. */
  unsetBroader: string
  /** The concept's new broader term, or `null` when it is simply dropped. */
  insertBroader: SkosConceptReference | null
}

/**
 * Plan the re-parenting of a concept: drop the reference to its former broader
 * term, and add one to its new broader term. A `null` `toParent` drops it with
 * nothing to replace it, which leaves the concept an orphan when that was its
 * last broader term in the scheme.
 *
 * Either way this is a single patch to a single document. The concept is
 * already a member of the scheme's `concepts[]` array and stays one, so no
 * scheme field changes. Moving a *top* concept is the case that needs a second
 * document, and is not this plan.
 *
 * `unsetBroader` and `insertBroader` go in one patch. The patch order Content
 * Lake applies is `setIfMissing` → `set` → `unset` → `insert`, so the unset of
 * the old reference lands before the new one is appended.
 */
export function planMoveConcept(input: MoveConceptInput): MoveConceptPlan {
  const target = deriveSchemeMutationTarget(input.scheme._id)
  const publishedId = getPublishedId(DocumentId(input.concept.id))

  return {
    kind: 'move',
    publishedId,
    // Same draft/version math as a new concept, applied to an existing one: the
    // moved concept is edited in whichever context its scheme is being edited.
    targetId: deriveNewConceptId(publishedId, target),
    isInRelease: target.isInRelease,
    unsetBroader: `broader[_ref=="${getPublishedId(DocumentId(input.fromParentId))}"]`,
    insertBroader: input.toParent
      ? {
          _key: input.broaderKey,
          _ref: getPublishedId(DocumentId(input.toParent.id)),
          _type: 'reference',
          ...conceptReferenceStrength(input.toParent._originalId ?? input.toParent.id),
        }
      : null,
  }
}

/**
 * The patch a {@link MoveConceptPlan} applies to the moved concept's document.
 *
 * One patch does both halves. Content Lake applies `setIfMissing` → `set` →
 * `unset` → `insert`, so the reference to the old broader term is gone before
 * the new one is appended, and `setIfMissing` guarantees there is an array to
 * append to even for a concept that had none. Verified against a real dataset:
 * appending after `broader[-1]` still lands when the unset emptied the array,
 * so these do not need to be two patches.
 *
 * Shaped to satisfy `@sanity/client`'s `PatchOperations` structurally, without
 * importing it — the core stays free of Sanity dependencies.
 */
export function conceptMovePatch(plan: MoveConceptPlan): {
  setIfMissing: {broader: never[]}
  unset: string[]
  insert?: {after: string; items: SkosConceptReference[]}
} {
  return {
    setIfMissing: {broader: []},
    unset: [plan.unsetBroader],
    ...(plan.insertBroader
      ? {insert: {after: 'broader[-1]', items: [plan.insertBroader]}}
      : {}),
  }
}
