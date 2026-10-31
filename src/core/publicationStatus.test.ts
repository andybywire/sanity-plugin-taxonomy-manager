import {describe, expect, it} from 'vitest'

import {collectDraftConceptIds, conceptStatusMarkers, hasDraftVersion} from './publicationStatus'

describe('hasDraftVersion', () => {
  it('reads a draft original id as having a draft', () => {
    expect(hasDraftVersion('drafts.concept-1')).toBe(true)
  })

  it('reads a published original id as having none', () => {
    expect(hasDraftVersion('concept-1')).toBe(false)
  })

  it('reads a release version as having no draft', () => {
    // The marker is gated off in a release, but the rule belongs here too: a
    // version is not a draft, and `!isPublishedId` would have called it one.
    expect(hasDraftVersion('versions.autumn.concept-1')).toBe(false)
  })

  it('returns false when the node carries no original id', () => {
    expect(hasDraftVersion(undefined)).toBe(false)
  })
})

describe('conceptStatusMarkers', () => {
  it('shows the draft ring before the published dot when both exist', () => {
    expect(conceptStatusMarkers({hasDraft: true, hasPublished: true})).toEqual([
      'draft',
      'published',
    ])
  })

  it('shows the published dot alone for a concept with no draft', () => {
    expect(conceptStatusMarkers({hasDraft: false, hasPublished: true})).toEqual(['published'])
  })

  it('shows the draft ring alone for a concept that has never been published', () => {
    expect(conceptStatusMarkers({hasDraft: true, hasPublished: false})).toEqual(['draft'])
  })

  it('shows nothing when neither version exists', () => {
    expect(conceptStatusMarkers({hasDraft: false, hasPublished: false})).toEqual([])
  })

  it('returns the same array for the same outcome, so a row can render it directly', () => {
    const first = conceptStatusMarkers({hasDraft: true, hasPublished: true})
    const second = conceptStatusMarkers({hasDraft: true, hasPublished: true})

    expect(first).toBe(second)
  })
})

describe('collectDraftConceptIds', () => {
  it('collects drafted concepts from every level, and leaves published ones out', () => {
    const tree = {
      topConcepts: [
        {
          id: 'top-1',
          prefLabel: 'Top',
          _originalId: 'drafts.top-1',
          childConcepts: [
            {id: 'child-1', prefLabel: 'Child', _originalId: 'child-1'},
            {
              id: 'child-2',
              prefLabel: 'Other',
              _originalId: 'drafts.child-2',
              childConcepts: [{id: 'grand-1', prefLabel: 'Deep', _originalId: 'drafts.grand-1'}],
            },
          ],
        },
      ],
      concepts: [{id: 'orphan-1', prefLabel: 'Orphan', _originalId: 'drafts.orphan-1'}],
    }

    expect(collectDraftConceptIds(tree)).toEqual(
      new Set(['top-1', 'child-2', 'grand-1', 'orphan-1']),
    )
  })

  it('counts a concept with two broader terms once', () => {
    const shared = {id: 'shared', prefLabel: 'Shared', _originalId: 'drafts.shared'}
    const tree = {
      topConcepts: [
        {id: 'a', prefLabel: 'A', _originalId: 'a', childConcepts: [shared]},
        {id: 'b', prefLabel: 'B', _originalId: 'b', childConcepts: [shared]},
      ],
      concepts: [],
    }

    expect(collectDraftConceptIds(tree)).toEqual(new Set(['shared']))
  })

  it('returns an empty set for a tree with nothing drafted', () => {
    const tree = {
      topConcepts: [{id: 'a', prefLabel: 'A', _originalId: 'a'}],
      concepts: [],
    }

    expect(collectDraftConceptIds(tree)).toEqual(new Set())
  })

  it('returns an empty set when there is no tree', () => {
    expect(collectDraftConceptIds(null)).toEqual(new Set())
  })
})
