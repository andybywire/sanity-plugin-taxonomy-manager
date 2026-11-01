import {DocumentId, getDraftId, getPublishedId} from '@sanity/id-utils'

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
  /** The broader term being left, or `null` for a concept that has none. */
  fromParentId: string | null
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
  /** Path unsetting the former broader term, or `null` when there was none. */
  unsetBroader: string | null
  /** The concept's new broader term, or `null` when it is simply dropped. */
  insertBroader: SkosConceptReference | null
}

/**
 * Plan the re-parenting of a concept: drop the reference to its former broader
 * term, and add one to its new broader term. A `null` `toParent` drops it with
 * nothing to replace it, which leaves the concept an orphan when that was its
 * last broader term in the scheme. A `null` `fromParentId` is the mirror image:
 * an orphan being given a broader term, with nothing to drop.
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
    unsetBroader:
      input.fromParentId === null
        ? null
        : `broader[_ref=="${getPublishedId(DocumentId(input.fromParentId))}"]`,
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
  unset?: string[]
  insert?: {after: string; items: SkosConceptReference[]}
} {
  return {
    setIfMissing: {broader: []},
    ...(plan.unsetBroader ? {unset: [plan.unsetBroader]} : {}),
    ...(plan.insertBroader ? {insert: {after: 'broader[-1]', items: [plan.insertBroader]}} : {}),
  }
}

export type SetTopConceptPlan = {
  kind: 'setTopConcept'
  schemeId: string
  createIfNotExists: SchemeDisplayed & {_id: string}
  /** The array the reference leaves. */
  unsetPaths: string[]
  /** The array it joins. */
  appendField: 'topConcepts' | 'concepts'
  reference: SkosConceptReference
}

/**
 * Plan a concept's move across the boundary between a scheme's `topConcepts[]`
 * and its `concepts[]` — promotion when `isTopConcept` is true, demotion when
 * it is false. One planner rather than two, because the two directions differ
 * only in which array each end of the move names.
 *
 * This is a single patch to a single document, the scheme. Promotion is only
 * offered on an orphan, which by definition has no broader term within this
 * scheme, so there is nothing on the concept itself to clear — the case that
 * would otherwise have made the concept render twice, once at the root and once
 * under its old parent, and would have needed two documents written together.
 *
 * Because only the scheme is patched, and `deriveSchemeMutationTarget` already
 * resolves a release version, these commands work inside a release. A move does
 * not: it patches the concept document through the Actions API, which has no
 * `versionId`.
 *
 * The reference is rebuilt rather than carried over, so its strength is decided
 * fresh from the concept's `_originalId` — a concept that is still a draft needs
 * a weak reference, as everywhere else.
 */
export function planSetTopConcept(input: {
  scheme: SchemeDisplayed
  concept: {id: string; _originalId?: string}
  /** The state being moved *to*, not the current one. */
  isTopConcept: boolean
  referenceKey: string
}): SetTopConceptPlan {
  const {schemeId} = deriveSchemeMutationTarget(input.scheme._id)
  const conceptRef = getPublishedId(DocumentId(input.concept.id))
  const from = input.isTopConcept ? 'concepts' : 'topConcepts'

  return {
    kind: 'setTopConcept',
    schemeId,
    createIfNotExists: {...input.scheme, _id: schemeId},
    unsetPaths: [`${from}[_ref=="${conceptRef}"]`],
    appendField: input.isTopConcept ? 'topConcepts' : 'concepts',
    reference: {
      _key: input.referenceKey,
      _ref: conceptRef,
      _type: 'reference',
      ...conceptReferenceStrength(input.concept._originalId ?? input.concept.id),
    },
  }
}

/** One document's half of an insert: where to write, and the reference to append. */
export type InsertConceptEdit = {
  /** Published id — the Actions API `publishedId`. */
  publishedId: string
  /** The draft the patch is applied to. */
  targetId: string
  reference: SkosConceptReference
}

export type InsertConceptPlan = {
  kind: 'insert'
  /** True when the scheme is being edited in a release, which this cannot target. */
  isInRelease: boolean
  /** Appends the concept to the scheme's membership. */
  schemeEdit: InsertConceptEdit & {appendField: 'concepts'}
  /** Appends the row's concept to the inserted concept's `broader`. */
  conceptEdit: InsertConceptEdit
}

/**
 * Plan the insertion of an existing concept as a child of another.
 *
 * Two documents, and both are required for the result to make sense: the scheme
 * gains the concept as a member, and the concept gains the row's concept as a
 * broader term. Either alone is wrong — a member with no broader term renders
 * at the root as an orphan, and a broader term on a non-member renders nowhere.
 * So the caller applies them as one atomic array of actions.
 *
 * The Actions API rather than `client.transaction()`, for the same reason a move
 * uses it: we never hold the chosen concept's full document, so there is nothing
 * to `createIfNotExists` from when it has no draft. `EditAction` creates the
 * draft from the published document — which is also why both documents end up
 * drafted, putting the editor in front of the two things left to publish.
 *
 * Drafts only. `EditAction` takes `draftId`/`publishedId` and has no
 * `versionId`, so a release needs `version.create` first — Phase 2, stage 10.
 *
 * Both references are rebuilt here rather than copied, so each takes its
 * strength from the document it points at: a reference to a concept that is
 * still a draft must be weak and strengthened on publish.
 */
export function planInsertConcept(input: {
  scheme: SchemeDisplayed
  /** The concept being inserted. */
  concept: {id: string; _originalId?: string}
  /** The row's concept, which becomes its broader term. */
  broaderConcept: {id: string; _originalId?: string}
  /** `_key` for the scheme's new membership reference. */
  schemeKey: string
  /** `_key` for the concept's new broader reference. */
  broaderKey: string
}): InsertConceptPlan {
  const schemePublishedId = getPublishedId(DocumentId(input.scheme._id))
  const conceptPublishedId = getPublishedId(DocumentId(input.concept.id))
  const broaderPublishedId = getPublishedId(DocumentId(input.broaderConcept.id))

  return {
    kind: 'insert',
    isInRelease: deriveSchemeMutationTarget(input.scheme._id).isInRelease,
    schemeEdit: {
      publishedId: schemePublishedId,
      targetId: getDraftId(DocumentId(schemePublishedId)),
      appendField: 'concepts',
      reference: {
        _key: input.schemeKey,
        _ref: conceptPublishedId,
        _type: 'reference',
        ...conceptReferenceStrength(input.concept._originalId ?? input.concept.id),
      },
    },
    conceptEdit: {
      publishedId: conceptPublishedId,
      targetId: getDraftId(DocumentId(conceptPublishedId)),
      reference: {
        _key: input.broaderKey,
        _ref: broaderPublishedId,
        _type: 'reference',
        ...conceptReferenceStrength(input.broaderConcept._originalId ?? input.broaderConcept.id),
      },
    },
  }
}

/**
 * The two patches an {@link InsertConceptPlan} applies, one per document.
 *
 * `setIfMissing` guarantees there is an array to append to — the scheme may
 * have no `concepts` yet, and the chosen concept may have no `broader`. Content
 * Lake applies `setIfMissing` before `insert`, so appending after `[-1]` lands
 * either way, as `conceptMovePatch` already relies on.
 *
 * Shaped to satisfy `@sanity/client`'s `PatchOperations` structurally, without
 * importing it — the core stays free of Sanity dependencies.
 */
export function insertSchemePatch(plan: InsertConceptPlan): {
  setIfMissing: Record<string, never[]>
  insert: {after: string; items: SkosConceptReference[]}
} {
  const field = plan.schemeEdit.appendField
  return {
    setIfMissing: {[field]: []},
    insert: {after: `${field}[-1]`, items: [plan.schemeEdit.reference]},
  }
}

export function insertBroaderPatch(plan: InsertConceptPlan): {
  setIfMissing: {broader: never[]}
  insert: {after: string; items: SkosConceptReference[]}
} {
  return {
    setIfMissing: {broader: []},
    insert: {after: 'broader[-1]', items: [plan.conceptEdit.reference]},
  }
}

export type InsertRootConceptPlan = {
  kind: 'insertRoot'
  schemeId: string
  createIfNotExists: SchemeDisplayed & {_id: string}
  appendField: 'topConcepts' | 'concepts'
  reference: SkosConceptReference
}

/**
 * Plan the insertion of an existing concept at the root of a scheme — as a top
 * concept, or as a plain member with no broader term supplied.
 *
 * One document, unlike inserting as a child. A concept at the root needs no
 * `broader` reference written: a top concept has none within its scheme by
 * definition, and a plain member added without one is what the query reads as
 * an orphan. So this is an append to the scheme and nothing else, on the same
 * `client.transaction()` path as create and remove — which also means it works
 * inside a release, where inserting as a child cannot.
 *
 * Note what this does *not* do: it never clears a broader term the concept
 * already has. A concept whose broader term is a member of this scheme will
 * therefore render under it rather than at the root, which is where it belongs
 * — the caller is responsible for not offering that as a *top concept*, where
 * SKOS says a broader term in the same scheme does not belong.
 */
export function planInsertRootConcept(input: {
  scheme: SchemeDisplayed
  concept: {id: string; _originalId?: string}
  conceptType: 'topConcept' | 'concept'
  referenceKey: string
}): InsertRootConceptPlan {
  const {schemeId} = deriveSchemeMutationTarget(input.scheme._id)

  return {
    kind: 'insertRoot',
    schemeId,
    createIfNotExists: {...input.scheme, _id: schemeId},
    appendField: input.conceptType === 'topConcept' ? 'topConcepts' : 'concepts',
    reference: {
      _key: input.referenceKey,
      _ref: getPublishedId(DocumentId(input.concept.id)),
      _type: 'reference',
      ...conceptReferenceStrength(input.concept._originalId ?? input.concept.id),
    },
  }
}

/**
 * The broader term a concept would hang under once it joins a scheme, or `null`
 * when it would sit at the root.
 *
 * The query computes `isOrphan` as "no broader reference that is a member of
 * this scheme", so a concept added without a broader term still renders nested
 * if it already had one pointing inside. This says where, so the tree can show
 * the result immediately rather than putting it at the root and then moving it.
 *
 * The first matching reference wins. A concept with two broader terms in the
 * scheme renders under both, and the tree will show the second once the
 * listener catches up.
 *
 * Pure: reads its arguments and returns a string or null.
 */
export function inSchemeBroaderRef(
  broaderRefs: readonly string[] | undefined,
  schemeMemberIds: readonly string[],
): string | null {
  return (broaderRefs ?? []).find((ref) => schemeMemberIds.includes(ref)) ?? null
}
