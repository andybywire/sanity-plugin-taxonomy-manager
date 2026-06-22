import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {renderWithUi} from '../../test/renderWithUi'
import type {ChildConceptTerm} from '../../types'

import {ConceptSelectLink} from './ConceptSelectLink'

const concept = (over: Partial<ChildConceptTerm> = {}): ChildConceptTerm => ({
  id: 'concept-1',
  prefLabel: 'Mathematics',
  ...over,
})

describe('ConceptSelectLink (recommendation display)', () => {
  it('shows a "recommended" badge, never a percentage', () => {
    renderWithUi(
      <ConceptSelectLink concept={concept({recommended: true})} selectConcept={() => undefined} />
    )

    expect(screen.getByText('recommended')).toBeInTheDocument()
    expect(screen.queryByText(/%/)).not.toBeInTheDocument()
  })

  it('shows no recommendation badge when the concept is not recommended', () => {
    renderWithUi(<ConceptSelectLink concept={concept()} selectConcept={() => undefined} />)

    expect(screen.queryByText('recommended')).not.toBeInTheDocument()
  })

  it('writes the concept reference when clicked', async () => {
    const selectConcept = vi.fn()
    renderWithUi(
      <ConceptSelectLink
        concept={concept({id: 'concept-9', _originalId: 'drafts.concept-9'})}
        selectConcept={selectConcept}
      />
    )

    await userEvent.setup().click(screen.getByRole('button', {name: /Mathematics/}))

    expect(selectConcept).toHaveBeenCalledWith({
      _ref: 'concept-9',
      _type: 'reference',
      _originalId: 'drafts.concept-9',
    })
  })
})
