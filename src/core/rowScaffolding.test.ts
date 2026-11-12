import {describe, expect, it} from 'vitest'

import {reservesGripSlot} from './rowScaffolding'

describe('reservesGripSlot', () => {
  it('reserves on a row that can be dragged', () => {
    expect(
      reservesGripSlot({isTopConcept: false, canEdit: true, schemeHasRootOrphans: false}),
    ).toBe(true)
  })

  // A top concept cannot be dragged — its move would cross between the
  // scheme's two arrays — but it still holds the slot when a sibling orphan
  // can be, or those orphans would read as nested under it.
  it('reserves on a top concept only when a root orphan can be dragged beside it', () => {
    expect(reservesGripSlot({isTopConcept: true, canEdit: true, schemeHasRootOrphans: true})).toBe(
      true,
    )
    expect(reservesGripSlot({isTopConcept: true, canEdit: true, schemeHasRootOrphans: false})).toBe(
      false,
    )
  })

  // Nothing is draggable where editing is off, so the slot would be dead
  // space on every row.
  it('reserves nothing where editing is not offered', () => {
    expect(
      reservesGripSlot({isTopConcept: false, canEdit: false, schemeHasRootOrphans: true}),
    ).toBe(false)
    expect(reservesGripSlot({isTopConcept: true, canEdit: false, schemeHasRootOrphans: true})).toBe(
      false,
    )
  })
})
