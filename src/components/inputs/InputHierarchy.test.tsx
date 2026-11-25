import {screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {ReleaseContext, SchemeContext} from '../../context'
import {TaxonomyPortProvider} from '../../seams/TaxonomyPortContext'
import {createFakeDataPort} from '../../test/FakeDataPort'
import {renderWithUi} from '../../test/renderWithUi'
import type {ConceptSchemeDocument, DocumentConcepts} from '../../types'

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
      </TaxonomyPortProvider>,
    )

    expect(document.querySelector('[data-ui="Spinner"]')).not.toBeNull()
    expect(port.lastWatchParams).toEqual({
      mode: 'input',
      documentId: 'scheme-9',
      branchId: 'branch-1',
      perspective: 'drafts',
    })
  })
})

/*
 * The hierarchy browser reads the same tree, which is how a deleted concept
 * reached editors who never open the Taxonomy tool: any document with a
 * hierarchy field on that scheme crashed on opening the browser.
 */
describe('InputHierarchy (deleted concepts)', () => {
  it('renders the tree when a referenced concept has been deleted', () => {
    const tree = {
      topConcepts: [null, {id: 'top-1', prefLabel: 'Animals'}],
      concepts: [null],
    } as unknown as DocumentConcepts

    renderWithUi(
      <TaxonomyPortProvider port={createFakeDataPort({tree})}>
        <SchemeContext.Provider value={scheme}>
          <ReleaseContext.Provider value={undefined}>
            <InputHierarchy inputComponent selectConcept={() => undefined} />
          </ReleaseContext.Provider>
        </SchemeContext.Provider>
      </TaxonomyPortProvider>,
    )

    expect(screen.getByRole('button', {name: /^Animals/})).toBeInTheDocument()
  })
})
