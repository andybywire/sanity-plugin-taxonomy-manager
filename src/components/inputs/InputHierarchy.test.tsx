import {screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {ReleaseContext, SchemeContext} from '../../context'
import {TaxonomyPortProvider} from '../../seams/TaxonomyPortContext'
import {createFakeDataPort} from '../../test/FakeDataPort'
import {renderWithUi} from '../../test/renderWithUi'
import type {ConceptSchemeDocument} from '../../types'

import {InputHierarchy} from './InputHierarchy'

const scheme = {
  displayed: {_id: 'scheme-9', _type: 'skosConceptScheme'},
} as unknown as ConceptSchemeDocument

describe('InputHierarchy (input watch seam)', () => {
  it('watches the branch-scoped input tree with the resolved params', () => {
    const port = createFakeDataPort({loading: true})

    renderWithUi(
      <TaxonomyPortProvider port={port}>
        <SchemeContext.Provider value={scheme}>
          <ReleaseContext.Provider value={'drafts'}>
            <InputHierarchy branchId={'branch-1'} inputComponent selectConcept={() => undefined} />
          </ReleaseContext.Provider>
        </SchemeContext.Provider>
      </TaxonomyPortProvider>
    )

    expect(screen.getByText('Loading hierarchy…')).toBeInTheDocument()
    expect(port.lastWatchParams).toEqual({
      mode: 'input',
      documentId: 'scheme-9',
      branchId: 'branch-1',
      perspective: 'drafts',
    })
  })
})
