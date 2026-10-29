import {describe, expect, it} from 'vitest'

import {activeConceptId, isActiveConcept} from './activeConcept'

describe('activeConceptId', () => {
  it('reads the pane group to the right of the tree pane', () => {
    const panes = [[{id: 'scheme-1'}], [{id: 'concept-1'}]]

    expect(activeConceptId(panes, 0)).toBe('concept-1')
  })

  it('normalizes a draft pane id to its published id', () => {
    const panes = [[{id: 'scheme-1'}], [{id: 'drafts.concept-1'}]]

    expect(activeConceptId(panes, 0)).toBe('concept-1')
  })

  it('normalizes a release version pane id to its published id', () => {
    const panes = [[{id: 'scheme-1'}], [{id: 'versions.autumn.concept-1'}]]

    expect(activeConceptId(panes, 0)).toBe('concept-1')
  })

  it('returns undefined when no pane is open to the right', () => {
    expect(activeConceptId([[{id: 'scheme-1'}]], 0)).toBeUndefined()
  })

  it('returns undefined when the router has no panes at all', () => {
    expect(activeConceptId([], 0)).toBeUndefined()
  })

  it('returns undefined when the group to the right is empty', () => {
    expect(activeConceptId([[{id: 'scheme-1'}], []], 0)).toBeUndefined()
  })

  it('ignores panes further right than the adjacent group', () => {
    const panes = [[{id: 'scheme-1'}], [{id: 'concept-1'}], [{id: 'concept-2'}]]

    expect(activeConceptId(panes, 0)).toBe('concept-1')
  })

  it('reads the adjacent group when the tree is nested deeper', () => {
    const panes = [[{id: 'root'}], [{id: 'scheme-1'}], [{id: 'concept-7'}]]

    expect(activeConceptId(panes, 1)).toBe('concept-7')
  })

  it('reads only the first sibling of a split pane group', () => {
    const panes = [[{id: 'scheme-1'}], [{id: 'concept-1'}, {id: 'concept-2'}]]

    expect(activeConceptId(panes, 0)).toBe('concept-1')
  })
})

describe('isActiveConcept', () => {
  it('matches the node whose id equals the active concept', () => {
    expect(isActiveConcept('concept-1', 'concept-1')).toBe(true)
  })

  it('does not match a sibling concept', () => {
    expect(isActiveConcept('concept-2', 'concept-1')).toBe(false)
  })

  it('normalizes a draft node id before comparing', () => {
    expect(isActiveConcept('drafts.concept-1', 'concept-1')).toBe(true)
  })

  it('normalizes a release version node id before comparing', () => {
    expect(isActiveConcept('versions.autumn.concept-1', 'concept-1')).toBe(true)
  })

  it('returns false when no concept is open', () => {
    expect(isActiveConcept('concept-1', undefined)).toBe(false)
  })

  it('returns false when the node has no id', () => {
    expect(isActiveConcept(undefined, 'concept-1')).toBe(false)
  })
})
