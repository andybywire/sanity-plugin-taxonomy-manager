import {describe, expect, it} from 'vitest'

import type {ConceptSchemeDocument} from '../types'

import {SKOS_CONCEPT_STRENGTHEN} from './ids'
import {
  conceptMovePatch,
  planCreateConcept,
  planMoveConcept,
  planRemoveConcept,
} from './mutations'

const scheme = (id: string): ConceptSchemeDocument['displayed'] =>
  ({_id: id, _type: 'skosConceptScheme', title: 'Test Scheme'}) as ConceptSchemeDocument['displayed']

describe('planCreateConcept', () => {
  it('plans a top concept on a published scheme (draft target, no broader)', () => {
    expect(
      planCreateConcept({
        scheme: scheme('scheme-1'),
        conceptType: 'topConcept',
        newConceptUuid: 'new-1',
        conceptId: 'abc123',
        schemeBaseIri: 'https://example.com/',
        newConceptKey: 'ref-key',
        broaderKey: 'broader-key',
      }),
    ).toEqual({
      kind: 'create',
      schemeId: 'drafts.scheme-1',
      newConceptId: 'drafts.new-1',
      createIfNotExists: {_id: 'drafts.scheme-1', _type: 'skosConceptScheme', title: 'Test Scheme'},
      create: {
        _id: 'drafts.new-1',
        _type: 'skosConcept',
        conceptId: 'abc123',
        prefLabel: '',
        baseIri: 'https://example.com/',
        broader: [],
        related: [],
      },
      appendField: 'topConcepts',
      reference: {
        _ref: 'new-1',
        _type: 'reference',
        _key: 'ref-key',
        _strengthenOnPublish: SKOS_CONCEPT_STRENGTHEN,
        _weak: true,
      },
    })
  })

  it('plans a child concept on a draft scheme with a published broader (strong broader ref)', () => {
    const plan = planCreateConcept({
      scheme: scheme('drafts.scheme-1'),
      conceptType: 'concept',
      broaderConcept: {id: 'broader-1', _originalId: 'broader-1'},
      newConceptUuid: 'new-2',
      conceptId: 'def456',
      schemeBaseIri: undefined,
      newConceptKey: 'ref-key',
      broaderKey: 'broader-key',
    })
    expect(plan.schemeId).toBe('drafts.scheme-1')
    expect(plan.newConceptId).toBe('drafts.new-2')
    expect(plan.appendField).toBe('concepts')
    expect(plan.create.broader).toEqual([
      {_key: 'broader-key', _ref: 'broader-1', _type: 'reference', _weak: false},
    ])
  })

  it('plans a child concept in a release with a draft broader (weak broader ref)', () => {
    const plan = planCreateConcept({
      scheme: scheme('versions.rel1.scheme-1'),
      conceptType: 'concept',
      broaderConcept: {id: 'broader-2', _originalId: 'drafts.broader-2'},
      newConceptUuid: 'new-3',
      conceptId: 'ghi789',
      schemeBaseIri: 'https://example.com/',
      newConceptKey: 'ref-key',
      broaderKey: 'broader-key',
    })
    expect(plan.schemeId).toBe('versions.rel1.scheme-1')
    expect(plan.newConceptId).toBe('versions.rel1.new-3')
    expect(plan.reference._ref).toBe('new-3')
    expect(plan.create.broader).toEqual([
      {
        _key: 'broader-key',
        _ref: 'broader-2',
        _type: 'reference',
        _weak: true,
        _strengthenOnPublish: SKOS_CONCEPT_STRENGTHEN,
      },
    ])
  })
})

describe('planRemoveConcept', () => {
  it('plans removal of a top concept from a published scheme (draft target)', () => {
    expect(
      planRemoveConcept({scheme: scheme('scheme-1'), conceptRef: 'concept-9', conceptType: 'topConcept'}),
    ).toEqual({
      kind: 'remove',
      schemeId: 'drafts.scheme-1',
      createIfNotExists: {_id: 'drafts.scheme-1', _type: 'skosConceptScheme', title: 'Test Scheme'},
      unsetPaths: ['topConcepts[_ref=="concept-9"]'],
    })
  })

  it('plans removal of a concept from a scheme in a release (version target)', () => {
    const plan = planRemoveConcept({
      scheme: scheme('versions.rel1.scheme-1'),
      conceptRef: 'concept-9',
      conceptType: 'concept',
    })
    expect(plan.schemeId).toBe('versions.rel1.scheme-1')
    expect(plan.unsetPaths).toEqual(['concepts[_ref=="concept-9"]'])
  })
})

describe('planMoveConcept', () => {
  it('plans a move on a published scheme (draft target, published new parent)', () => {
    expect(
      planMoveConcept({
        scheme: scheme('scheme-1'),
        concept: {id: 'falcons'},
        fromParentId: 'birds',
        toParent: {id: 'mammals', _originalId: 'mammals'},
        broaderKey: 'broader-key',
      }),
    ).toEqual({
      kind: 'move',
      publishedId: 'falcons',
      targetId: 'drafts.falcons',
      isInRelease: false,
      unsetBroader: 'broader[_ref=="birds"]',
      insertBroader: {
        _key: 'broader-key',
        _ref: 'mammals',
        _type: 'reference',
        _weak: false,
      },
    })
  })

  it('plans a move in a release against the version of the concept', () => {
    const plan = planMoveConcept({
      scheme: scheme('versions.rel1.scheme-1'),
      concept: {id: 'falcons'},
      fromParentId: 'birds',
      toParent: {id: 'mammals', _originalId: 'mammals'},
      broaderKey: 'broader-key',
    })
    expect(plan.targetId).toBe('versions.rel1.falcons')
    expect(plan.isInRelease).toBe(true)
    expect(plan.publishedId).toBe('falcons')
  })

  it('weakens the new broader reference when the new parent is not published yet', () => {
    const plan = planMoveConcept({
      scheme: scheme('scheme-1'),
      concept: {id: 'falcons'},
      fromParentId: 'birds',
      toParent: {id: 'mammals', _originalId: 'drafts.mammals'},
      broaderKey: 'broader-key',
    })
    expect(plan.insertBroader).toEqual({
      _key: 'broader-key',
      _ref: 'mammals',
      _type: 'reference',
      _weak: true,
      _strengthenOnPublish: SKOS_CONCEPT_STRENGTHEN,
    })
  })

  it('normalizes every id to its published form, on both sides of the patch', () => {
    const plan = planMoveConcept({
      scheme: scheme('scheme-1'),
      concept: {id: 'drafts.falcons'},
      fromParentId: 'drafts.birds',
      toParent: {id: 'drafts.mammals', _originalId: 'drafts.mammals'},
      broaderKey: 'broader-key',
    })
    expect(plan.publishedId).toBe('falcons')
    expect(plan.targetId).toBe('drafts.falcons')
    expect(plan.unsetBroader).toBe('broader[_ref=="birds"]')
    expect(plan.insertBroader!._ref).toBe('mammals')
  })

  it('falls back to the concept id when the new parent carries no _originalId', () => {
    const plan = planMoveConcept({
      scheme: scheme('scheme-1'),
      concept: {id: 'falcons'},
      fromParentId: 'birds',
      toParent: {id: 'mammals'},
      broaderKey: 'broader-key',
    })
    expect(plan.insertBroader!._weak).toBe(false)
  })
})

describe('planMoveConcept, out of the hierarchy', () => {
  it('plans a dropped broader term as an unset with nothing inserted', () => {
    expect(
      planMoveConcept({
        scheme: scheme('scheme-1'),
        concept: {id: 'falcons'},
        fromParentId: 'birds',
        toParent: null,
      }),
    ).toEqual({
      kind: 'move',
      publishedId: 'falcons',
      targetId: 'drafts.falcons',
      isInRelease: false,
      unsetBroader: 'broader[_ref=="birds"]',
      insertBroader: null,
    })
  })

  it('targets the release version when the scheme is being edited in one', () => {
    const plan = planMoveConcept({
      scheme: scheme('versions.rel1.scheme-1'),
      concept: {id: 'falcons'},
      fromParentId: 'birds',
      toParent: null,
    })
    expect(plan.targetId).toBe('versions.rel1.falcons')
    expect(plan.isInRelease).toBe(true)
    expect(plan.insertBroader).toBeNull()
  })
})

describe('conceptMovePatch', () => {
  const plan = (toParent: {id: string; _originalId?: string} | null) =>
    toParent === null
      ? planMoveConcept({
          scheme: scheme('scheme-1'),
          concept: {id: 'falcons'},
          fromParentId: 'birds',
          toParent: null,
        })
      : planMoveConcept({
          scheme: scheme('scheme-1'),
          concept: {id: 'falcons'},
          fromParentId: 'birds',
          toParent,
          broaderKey: 'broader-key',
        })

  it('drops the old reference and appends the new one in a single patch', () => {
    expect(conceptMovePatch(plan({id: 'mammals', _originalId: 'mammals'}))).toEqual({
      // Content Lake applies setIfMissing → set → unset → insert, so one patch
      // can empty the old reference out and append the new one after it.
      setIfMissing: {broader: []},
      unset: ['broader[_ref=="birds"]'],
      insert: {
        after: 'broader[-1]',
        items: [{_key: 'broader-key', _ref: 'mammals', _type: 'reference', _weak: false}],
      },
    })
  })

  it('omits the insert entirely when the broader term is simply dropped', () => {
    expect(conceptMovePatch(plan(null))).toEqual({
      setIfMissing: {broader: []},
      unset: ['broader[_ref=="birds"]'],
    })
  })
})
