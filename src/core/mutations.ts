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
 * "Describe, don't execute": the planners below compute a pure description of
 * the document actions a concept mutation should dispatch. The hooks stay thin
 * — they generate the random ids/keys, pass them in, and hand the plan to the
 * port, which turns it into actions with {@link conceptPlanEdits}. This makes
 * the release/version-aware mutation logic exhaustively unit-testable without a
 * Studio.
 *
 * Every plan is applied through the Actions API rather than
 * `client.transaction()`, and the reason is the same in each case: we never
 * hold the whole document. The tree query projects a handful of fields, and the
 * insert picker fewer still, so `createIfNotExists` has nothing to create from.
 * `sanity.action.document.edit` creates the draft — or the release version —
 * **from the published document** and patches it in one call.
 *
 * That server-side seeding is the correctness argument, not just a convenience.
 * Seeding from `displayed` instead, as this module used to, copies whatever the
 * form holds: in a release perspective that is the *draft*, while the tree is
 * rendering the release layered over *published*. Adding one concept to a
 * scheme in a release was observed writing a version carrying two unpublished
 * draft members the editor had never seen, which publishing the release would
 * then have published. The server's seed matches what is on screen.
 */

/** Which document an edit is applied to. */
export type EditTarget = {
  /** The published id — the Actions API `publishedId`. */
  publishedId: string
  /**
   * The draft or release version to patch. It need not exist: the edit action
   * creates it from the published document.
   */
  targetId: string
}

/**
 * A patch, shaped to satisfy `@sanity/client`'s `PatchOperations` structurally
 * without importing it — the core stays free of Sanity dependencies.
 */
export type ConceptPatch = {
  setIfMissing?: Record<string, never[]>
  unset?: string[]
  insert?: {after: string; items: SkosConceptReference[]}
}

/**
 * One document action in a plan. A plan's edits are dispatched as a single
 * atomic array, so either every document lands or none does.
 */
export type ConceptEdit =
  | {
      op: 'create'
      publishedId: string
      /** The draft or version document to create, `_id` included. */
      attributes: SkosConceptDocument
    }
  | ({op: 'edit'; patch: ConceptPatch} & EditTarget)

/**
 * Append `reference` to `field`, optionally clearing other paths first.
 *
 * Content Lake applies `setIfMissing` → `set` → `unset` → `insert`, so the
 * array exists before the append, and an unset of the reference's former home
 * lands before it is added to its new one. Verified against a real dataset:
 * appending after `[-1]` still lands when an unset has just emptied the array,
 * so these never need to be split into two patches.
 */
function appendTo(field: string, reference: SkosConceptReference, unset?: string[]): ConceptPatch {
  return {
    setIfMissing: {[field]: []},
    ...(unset ? {unset} : {}),
    insert: {after: `${field}[-1]`, items: [reference]},
  }
}

export type CreateConceptPlan = {
  kind: 'create'
  newConceptId: string
  scheme: EditTarget
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
    newConceptId,
    scheme: {publishedId: target.publishedId, targetId: target.schemeId},
    create,
    appendField: input.conceptType === 'topConcept' ? 'topConcepts' : 'concepts',
    reference,
  }
}

export type RemoveConceptPlan = {
  kind: 'remove'
  scheme: EditTarget
  unsetPaths: string[]
}

export function planRemoveConcept(input: {
  scheme: SchemeDisplayed
  conceptRef: string
  conceptType: string
}): RemoveConceptPlan {
  const field = input.conceptType === 'topConcept' ? 'topConcepts' : 'concepts'
  const target = deriveSchemeMutationTarget(input.scheme._id)
  return {
    kind: 'remove',
    scheme: {publishedId: target.publishedId, targetId: target.schemeId},
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
  /** The moved concept: its published id, and the draft or version to patch. */
  concept: EditTarget
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
 * The concept is edited in whichever context its scheme is being edited — the
 * same draft/version math as a new concept, applied to an existing one — so a
 * move inside a release patches the release version.
 */
export function planMoveConcept(input: MoveConceptInput): MoveConceptPlan {
  const target = deriveSchemeMutationTarget(input.scheme._id)
  const publishedId = getPublishedId(DocumentId(input.concept.id))

  return {
    kind: 'move',
    concept: {publishedId, targetId: deriveNewConceptId(publishedId, target)},
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

export type SetTopConceptPlan = {
  kind: 'setTopConcept'
  scheme: EditTarget
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
  const target = deriveSchemeMutationTarget(input.scheme._id)
  const conceptRef = getPublishedId(DocumentId(input.concept.id))
  const from = input.isTopConcept ? 'concepts' : 'topConcepts'

  return {
    kind: 'setTopConcept',
    scheme: {publishedId: target.publishedId, targetId: target.schemeId},
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
export type InsertConceptEdit = EditTarget & {reference: SkosConceptReference}

export type InsertConceptPlan = {
  kind: 'insert'
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
 * So the two edits are dispatched as one atomic array.
 *
 * Both documents follow the scheme's own draft/version context, so an insert
 * inside a release writes release versions of both.
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
  const target = deriveSchemeMutationTarget(input.scheme._id)
  const conceptPublishedId = getPublishedId(DocumentId(input.concept.id))
  const broaderPublishedId = getPublishedId(DocumentId(input.broaderConcept.id))

  return {
    kind: 'insert',
    schemeEdit: {
      publishedId: target.publishedId,
      targetId: target.schemeId,
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
      targetId: deriveNewConceptId(conceptPublishedId, target),
      reference: {
        _key: input.broaderKey,
        _ref: broaderPublishedId,
        _type: 'reference',
        ...conceptReferenceStrength(input.broaderConcept._originalId ?? input.broaderConcept.id),
      },
    },
  }
}

export type InsertRootConceptPlan = {
  kind: 'insertRoot'
  scheme: EditTarget
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
 * an orphan. So this is an append to the scheme and nothing else.
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
  const target = deriveSchemeMutationTarget(input.scheme._id)

  return {
    kind: 'insertRoot',
    scheme: {publishedId: target.publishedId, targetId: target.schemeId},
    appendField: input.conceptType === 'topConcept' ? 'topConcepts' : 'concepts',
    reference: {
      _key: input.referenceKey,
      _ref: getPublishedId(DocumentId(input.concept.id)),
      _type: 'reference',
      ...conceptReferenceStrength(input.concept._originalId ?? input.concept.id),
    },
  }
}

/** A create, remove, move or top-concept plan, discriminated by `kind`. */
export type ConceptPlan =
  | CreateConceptPlan
  | RemoveConceptPlan
  | MoveConceptPlan
  | SetTopConceptPlan
  | InsertConceptPlan
  | InsertRootConceptPlan

/**
 * The document actions a plan performs, in the order they are dispatched.
 *
 * This is the whole of the seam's mutation logic: the adapter maps each edit
 * onto an Actions API call and sends the array, and does nothing else. Keeping
 * the switch here rather than in the adapter is what makes every mutation —
 * drafts and releases alike — testable as plain input→output.
 */
export function conceptPlanEdits(plan: ConceptPlan): ConceptEdit[] {
  switch (plan.kind) {
    case 'create':
      // The new concept and the scheme's reference to it, atomically: a scheme
      // member that was never created renders nothing, and a concept no scheme
      // lists is invisible to the tree.
      return [
        {
          op: 'create',
          publishedId: getPublishedId(DocumentId(plan.newConceptId)),
          attributes: plan.create,
        },
        {...plan.scheme, op: 'edit', patch: appendTo(plan.appendField, plan.reference)},
      ]
    case 'remove':
      // No `setIfMissing`: unsetting from an array that is not there is already
      // a no-op, and creating it first would write an empty array for nothing.
      return [{...plan.scheme, op: 'edit', patch: {unset: plan.unsetPaths}}]
    case 'move':
      return [
        {
          ...plan.concept,
          op: 'edit',
          patch: {
            setIfMissing: {broader: []},
            ...(plan.unsetBroader ? {unset: [plan.unsetBroader]} : {}),
            ...(plan.insertBroader
              ? {insert: {after: 'broader[-1]', items: [plan.insertBroader]}}
              : {}),
          },
        },
      ]
    case 'setTopConcept':
      // The unset and the append name different arrays, so the order Content
      // Lake applies them in does not matter here.
      return [
        {
          ...plan.scheme,
          op: 'edit',
          patch: appendTo(plan.appendField, plan.reference, plan.unsetPaths),
        },
      ]
    case 'insert':
      return [
        {
          publishedId: plan.schemeEdit.publishedId,
          targetId: plan.schemeEdit.targetId,
          op: 'edit',
          patch: appendTo(plan.schemeEdit.appendField, plan.schemeEdit.reference),
        },
        {
          publishedId: plan.conceptEdit.publishedId,
          targetId: plan.conceptEdit.targetId,
          op: 'edit',
          patch: appendTo('broader', plan.conceptEdit.reference),
        },
      ]
    case 'insertRoot':
      return [{...plan.scheme, op: 'edit', patch: appendTo(plan.appendField, plan.reference)}]
    default: {
      const unreachable: never = plan
      throw new Error(`Unknown concept plan: ${JSON.stringify(unreachable)}`)
    }
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
