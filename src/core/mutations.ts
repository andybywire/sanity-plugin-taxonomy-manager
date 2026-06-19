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
 * "Describe, don't execute": the create/remove planners below compute a pure
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
