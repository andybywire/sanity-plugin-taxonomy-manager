import {renderHook} from '@testing-library/react'
import type {ReactNode} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {SchemeContext, TreeContext} from '../context'
import {TaxonomyPortProvider} from '../seams/TaxonomyPortContext'
import {createFakeDataPort} from '../test/FakeDataPort'
import {UiProviders} from '../test/renderWithUi'
import type {ConceptSchemeDocument, DocumentConcepts} from '../types'

import {useConceptDrop} from './useConceptDrop'

const scheme = {
  displayed: {_id: 'scheme-1', _type: 'skosConceptScheme', title: 'Test Scheme'},
} as unknown as ConceptSchemeDocument

/**
 * Animals ─┬─ Birds ── Falcons
 *          └─ Mammals
 * Unfiled (orphan)
 */
const tree = (): DocumentConcepts => ({
  topConcepts: [
    {
      id: 'animals',
      prefLabel: 'Animals',
      childConcepts: [
        {
          id: 'birds',
          prefLabel: 'Birds',
          level: 1,
          childConcepts: [{id: 'falcons', prefLabel: 'Falcons', level: 2}],
        },
        {id: 'mammals', prefLabel: 'Mammals', level: 1},
      ],
    },
  ],
  concepts: [{id: 'unfiled', prefLabel: 'Unfiled', level: 0, isOrphan: true}],
})

function renderDrop(port: ReturnType<typeof createFakeDataPort>) {
  return renderHook(() => useConceptDrop(), {
    wrapper: ({children}: {children: ReactNode}) => (
      <UiProviders>
        <TaxonomyPortProvider port={port}>
          <SchemeContext.Provider value={scheme}>
            <TreeContext.Provider value={{concepts: tree()}}>{children}</TreeContext.Provider>
          </SchemeContext.Provider>
        </TaxonomyPortProvider>
      </UiProviders>
    ),
  })
}

beforeEach(() => vi.clearAllMocks())

describe('useConceptDrop', () => {
  it('routes a legal drop through the port as a move plan', () => {
    const port = createFakeDataPort()
    const {result} = renderDrop(port)

    result.current(
      {conceptId: 'falcons', fromParentId: 'birds', prefLabel: 'Falcons'},
      {conceptId: 'mammals', _originalId: 'mammals', prefLabel: 'Mammals'},
    )

    expect(port.appliedPlans).toHaveLength(1)
    expect(port.appliedPlans[0]).toMatchObject({
      kind: 'move',
      publishedId: 'falcons',
      unsetBroader: 'broader[_ref=="birds"]',
      insertBroader: {_ref: 'mammals', _type: 'reference'},
    })
  })

  it('brings an orphan into the hierarchy, with nothing to unset', () => {
    const port = createFakeDataPort()
    const {result} = renderDrop(port)

    result.current(
      {conceptId: 'unfiled', fromParentId: null, prefLabel: 'Unfiled'},
      {conceptId: 'mammals', _originalId: 'mammals', prefLabel: 'Mammals'},
    )

    expect(port.appliedPlans[0]).toMatchObject({
      kind: 'move',
      publishedId: 'unfiled',
      unsetBroader: null,
      insertBroader: {_ref: 'mammals'},
    })
  })

  it('does nothing at all when the drop lands outside any row', () => {
    const port = createFakeDataPort()
    const {result} = renderDrop(port)

    result.current({conceptId: 'falcons', fromParentId: 'birds'}, null)

    expect(port.appliedPlans).toHaveLength(0)
  })

  it('applies nothing when the hierarchy cannot take the drop', () => {
    const port = createFakeDataPort()
    const {result} = renderDrop(port)

    // Birds is where Falcons already sits.
    result.current({conceptId: 'falcons', fromParentId: 'birds'}, {conceptId: 'birds'})
    // And a concept cannot land beneath its own narrower term.
    result.current({conceptId: 'birds', fromParentId: 'animals'}, {conceptId: 'falcons'})

    expect(port.appliedPlans).toHaveLength(0)
  })

  it('accepts a drop onto a top concept', () => {
    const port = createFakeDataPort()
    const {result} = renderDrop(port)

    result.current(
      {conceptId: 'falcons', fromParentId: 'birds'},
      {conceptId: 'animals', prefLabel: 'Animals'},
    )

    expect(port.appliedPlans[0]).toMatchObject({insertBroader: {_ref: 'animals'}})
  })
})
