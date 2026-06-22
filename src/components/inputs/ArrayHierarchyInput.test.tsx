import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type {ReactNode} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {TaxonomyPortProvider} from '../../seams/TaxonomyPortContext'
import {createFakeDataPort} from '../../test/FakeDataPort'
import {arrayFieldProps, fakeSchemeClient, filterFor} from '../../test/inputHarness'
import {renderWithUi} from '../../test/renderWithUi'

import {ArrayHierarchyInput} from './ArrayHierarchyInput'

// See ReferenceHierarchyInput.test.tsx for the harness rationale: stub the Studio
// hooks/chrome from `sanity`, drive the data seam through an injected FakeDataPort.
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

function renderInput(props = arrayFieldProps(), port = createFakeDataPort()) {
  return renderWithUi(
    <TaxonomyPortProvider port={port}>
      <ArrayHierarchyInput {...props} />
    </TaxonomyPortProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.useClient.mockReturnValue(fakeSchemeClient())
  mocks.useFormValue.mockReturnValue('doc-1')
  mocks.usePerspective.mockReturnValue({selectedPerspectiveName: undefined})
})

describe('ArrayHierarchyInput', () => {
  it('warns when the field is configured without a filter', () => {
    renderInput(arrayFieldProps({schemaType: {of: [{options: {}}]}}))

    expect(screen.getByText(/must be used with an accompanying/i)).toBeInTheDocument()
  })

  it('warns and falls back when the array has more than one schema type', () => {
    renderInput(
      arrayFieldProps({
        schemaType: {of: [{options: {filter: filterFor({schemeId: 'scheme-x'})}}, {options: {}}]},
      })
    )

    expect(screen.getByText(/not supported for multi-schema arrays/i)).toBeInTheDocument()
  })

  it('disables the browse button on the published perspective', async () => {
    mocks.usePerspective.mockReturnValue({selectedPerspectiveName: 'published'})
    renderInput()

    expect(await screen.findByRole('button', {name: /browse taxonomy tree/i})).toBeDisabled()
  })

  it('suppresses the default input in browse-only mode, showing an empty preview', async () => {
    renderInput(
      arrayFieldProps({
        schemaType: {of: [{options: {filter: filterFor({schemeId: 'scheme-x'}, {browseOnly: true})}}]},
      })
    )

    expect(await screen.findByText('No items')).toBeInTheDocument()
    expect(screen.queryByTestId('default-input')).not.toBeInTheDocument()
  })

  it('warns instead of adding a term already present in the field', async () => {
    const port = createFakeDataPort({
      tree: {topConcepts: [{id: 'concept-1', prefLabel: 'Biology', _originalId: 'concept-1'}], concepts: []},
    })
    renderInput(
      arrayFieldProps({value: [{_key: 'k1', _ref: 'concept-1', _type: 'reference'}]}),
      port
    )

    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', {name: /browse taxonomy tree/i}))
    await user.click(await screen.findByRole('button', {name: /Biology/}))

    expect(await screen.findByText(/already included in this field/i)).toBeInTheDocument()
  })
})
