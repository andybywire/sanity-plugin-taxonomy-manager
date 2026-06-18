import {describe, expect, it} from 'vitest'

import {
  conceptReferenceStrength,
  deriveNewConceptId,
  deriveSchemeMutationTarget,
  SKOS_CONCEPT_STRENGTHEN,
} from './ids'

describe('deriveSchemeMutationTarget', () => {
  it('targets the draft id for a published scheme', () => {
    expect(deriveSchemeMutationTarget('scheme-1')).toEqual({
      isInRelease: false,
      releaseName: undefined,
      schemeId: 'drafts.scheme-1',
    })
  })

  it('targets the draft id for a scheme that is already a draft', () => {
    expect(deriveSchemeMutationTarget('drafts.scheme-1')).toEqual({
      isInRelease: false,
      releaseName: undefined,
      schemeId: 'drafts.scheme-1',
    })
  })

  it('targets the version id (and extracts the release) for a scheme in a release', () => {
    expect(deriveSchemeMutationTarget('versions.rel1.scheme-1')).toEqual({
      isInRelease: true,
      releaseName: 'rel1',
      schemeId: 'versions.rel1.scheme-1',
    })
  })
})

describe('deriveNewConceptId', () => {
  it('creates a draft id when not in a release', () => {
    expect(deriveNewConceptId('new-1', {isInRelease: false, releaseName: undefined})).toBe(
      'drafts.new-1',
    )
  })

  it('creates a version id when in a release', () => {
    expect(deriveNewConceptId('new-1', {isInRelease: true, releaseName: 'rel1'})).toBe(
      'versions.rel1.new-1',
    )
  })
})

describe('conceptReferenceStrength', () => {
  it('is a strong (non-weak) reference when the concept is published', () => {
    expect(conceptReferenceStrength('concept-1')).toEqual({_weak: false})
  })

  it('is weak + strengthen-on-publish when the concept is a draft', () => {
    expect(conceptReferenceStrength('drafts.concept-1')).toEqual({
      _weak: true,
      _strengthenOnPublish: SKOS_CONCEPT_STRENGTHEN,
    })
  })

  it('is weak + strengthen-on-publish when the concept is in a release', () => {
    expect(conceptReferenceStrength('versions.rel1.concept-1')).toEqual({
      _weak: true,
      _strengthenOnPublish: {type: 'skosConcept', template: {id: 'skosConcept'}},
    })
  })
})
