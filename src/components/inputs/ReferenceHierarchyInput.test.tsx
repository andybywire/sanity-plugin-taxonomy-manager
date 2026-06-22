import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type {ReactNode} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {TaxonomyPortProvider} from '../../seams/TaxonomyPortContext'
import {createFakeDataPort} from '../../test/FakeDataPort'
import {fakeSchemeClient, filterFor, referenceFieldProps} from '../../test/inputHarness'
import {renderWithUi} from '../../test/renderWithUi'

import {ReferenceHierarchyInput} from './ReferenceHierarchyInput'

// jsdom has no Studio runtime, so the Studio hooks the input pulls from `sanity`
// are replaced with controllable fakes and FormField with a passthrough. The data
// seam goes through an injected FakeDataPort, so the real recommendations hook
// (which also reads the client) is never reached. isDraftId/isVersionId stay real.
const mocks = vi.hoisted(() => ({
  useClient: vi.fn(),
  useFormValue: vi.fn(),
  usePerspective: vi.fn(),
}))

vi.mock('sanity', async (importOriginal) => {
  const actual = await importOriginal<typeof import('sanity')>()
  return {
    ...actual,
    useClient: mocks.useClient,
    useFormValue: mocks.useFormValue,
    usePerspective: mocks.usePerspective,
    FormField: ({title, children}: {title?: string; children?: ReactNode}) => (
      <div data-testid="form-field">
        {title}
        {children}
      </div>
    ),
  }
})

function renderInput(
  props = referenceFieldProps(),
  port = createFakeDataPort()
) {
  return renderWithUi(
    <TaxonomyPortProvider port={port}>
      <ReferenceHierarchyInput {...props} />
    </TaxonomyPortProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.useClient.mockReturnValue(fakeSchemeClient())
  mocks.useFormValue.mockReturnValue('doc-1')
  mocks.usePerspective.mockReturnValue({selectedPerspectiveName: undefined})
})

describe('ReferenceHierarchyInput', () => {
  it('warns when the field is configured without a filter', () => {
    renderInput(referenceFieldProps({schemaType: {options: {}}}))

    expect(screen.getByText(/must be used with an accompanying/i)).toBeInTheDocument()
  })

  it('disables the browse button on the published perspective', async () => {
    mocks.usePerspective.mockReturnValue({selectedPerspectiveName: 'published'})
    renderInput()

    expect(await screen.findByRole('button', {name: /browse taxonomy tree/i})).toBeDisabled()
  })

  it('enables the browse button off the published perspective', async () => {
    renderInput()

    expect(await screen.findByRole('button', {name: /browse taxonomy tree/i})).toBeEnabled()
  })

  it('suppresses the default input in browse-only mode, showing an empty preview', async () => {
    renderInput(
      referenceFieldProps({
        schemaType: {options: {filter: filterFor({schemeId: 'scheme-x'}, {browseOnly: true})}},
      })
    )

    expect(await screen.findByText('No items')).toBeInTheDocument()
    expect(screen.queryByTestId('default-input')).not.toBeInTheDocument()
  })

  it('renders the default input when not browse-only', async () => {
    renderInput()

    expect(await screen.findByTestId('default-input')).toBeInTheDocument()
  })

  it('runs a scheme-scoped search on browse and badges recommended concepts', async () => {
    const port = createFakeDataPort({
      tree: {topConcepts: [{id: 'concept-1', prefLabel: 'Biology', _originalId: 'concept-1'}], concepts: []},
      recommendations: [{conceptId: 'concept-1', score: 0.9}],
    })
    renderInput(referenceFieldProps(), port)

    await userEvent.setup().click(await screen.findByRole('button', {name: /browse taxonomy tree/i}))

    // The search is triggered scoped to the field's resolved scheme...
    expect(port.lastSearchSchemeId).toBe('scheme-x')
    // ...and the recommended concept is badged in the opened tree.
    expect(await screen.findByText('Biology')).toBeInTheDocument()
    expect(await screen.findByText('recommended')).toBeInTheDocument()
  })
})
