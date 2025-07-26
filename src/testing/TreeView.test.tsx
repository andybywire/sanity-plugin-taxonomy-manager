/* eslint-disable react/jsx-no-bind */
/* eslint-disable react/require-default-props */
import {render, screen} from '@testing-library/react'
import type {ReactNode} from 'react'
import {describe, it, expect, vi} from 'vitest'

import {TreeView} from '../components/TreeView'

// Mock Sanity UI components
vi.mock('@sanity/ui', () => ({
  Container: ({children}: {children?: ReactNode}) => <div data-testid="container">{children}</div>,
  Box: ({children}: {children?: ReactNode}) => <div data-testid="box">{children}</div>,
  Stack: ({children}: {children?: ReactNode}) => <div data-testid="stack">{children}</div>,
  Text: ({children}: {children?: ReactNode}) => <span data-testid="text">{children}</span>,
}))

// Mock usePerspective hook
vi.mock('sanity', () => ({
  usePerspective: () => ({selectedPerspectiveName: 'published'}),
}))

// Mock child components
vi.mock('./Hierarchy', () => ({
  Hierarchy: ({inputComponent, branchId}: {inputComponent: boolean; branchId: string}) => (
    <div data-testid="hierarchy" data-input-component={inputComponent} data-branch-id={branchId}>
      Hierarchy Component
    </div>
  ),
}))

vi.mock('./inputs', () => ({
  InputHierarchy: ({
    inputComponent,
    branchId,
    selectConcept,
  }: {
    inputComponent: boolean
    branchId: string
    selectConcept?: (conceptId: string) => void
  }) => (
    <div
      data-testid="input-hierarchy"
      data-input-component={inputComponent}
      data-branch-id={branchId}
      data-has-select-concept={!!selectConcept}
    >
      Input Hierarchy Component
    </div>
  ),
}))

describe('TreeView', () => {
  const mockDocument = {
    _id: 'abc123',
    _rev: 'rev123',
    _type: 'skosConceptScheme' as const,
    _createdAt: '2024-01-01T00:00:00Z',
    _updatedAt: '2024-01-01T00:00:00Z',
    displayed: {
      _id: 'abc123',
      _type: 'skosConceptScheme' as const,
      title: 'Test Scheme',
      description: 'Test description',
    },
  }

  describe('Component Mode Outcomes', () => {
    it('should render InputHierarchy when inputComponent is true', () => {
      render(
        <TreeView
          document={mockDocument}
          branchId="test-branch"
          inputComponent
          selectConcept={() => undefined}
        />
      )

      // Should render InputHierarchy component
      expect(screen.getByTestId('input-hierarchy')).toBeInTheDocument()

      // Should NOT render the full view container
      expect(screen.queryByTestId('container')).not.toBeInTheDocument()

      // Should NOT render description section
      expect(screen.queryByText('Description')).not.toBeInTheDocument()
      expect(screen.queryByText('Test description')).not.toBeInTheDocument()

      // Should NOT render Hierarchy component
      expect(screen.queryByTestId('hierarchy')).not.toBeInTheDocument()
    })

    it('should render full view with description and Hierarchy when inputComponent is false', () => {
      render(
        <TreeView
          document={mockDocument}
          branchId="test-branch"
          inputComponent={false}
          selectConcept={() => undefined}
        />
      )

      // Should render the full view container
      expect(screen.getByTestId('container')).toBeInTheDocument()

      // Should render description section
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('Test description')).toBeInTheDocument()

      // Should render Hierarchy component
      expect(screen.getByTestId('hierarchy')).toBeInTheDocument()

      // Should NOT render InputHierarchy component
      expect(screen.queryByTestId('input-hierarchy')).not.toBeInTheDocument()
    })

    it('should render full view by default when inputComponent is not specified', () => {
      render(
        <TreeView document={mockDocument} branchId="test-branch" selectConcept={() => undefined} />
      )

      // Should render the full view container (default behavior)
      expect(screen.getByTestId('container')).toBeInTheDocument()

      // Should render description section
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('Test description')).toBeInTheDocument()

      // Should render Hierarchy component
      expect(screen.getByTestId('hierarchy')).toBeInTheDocument()

      // Should NOT render InputHierarchy component
      expect(screen.queryByTestId('input-hierarchy')).not.toBeInTheDocument()
    })

    it('should pass correct props to InputHierarchy when in input mode', () => {
      const mockSelectConcept = vi.fn()

      render(
        <TreeView
          document={mockDocument}
          branchId="test-branch"
          inputComponent
          selectConcept={mockSelectConcept}
        />
      )

      const inputHierarchy = screen.getByTestId('input-hierarchy')

      // Should pass correct props to InputHierarchy
      expect(inputHierarchy).toHaveAttribute('data-input-component', 'true')
      expect(inputHierarchy).toHaveAttribute('data-branch-id', 'test-branch')
      expect(inputHierarchy).toHaveAttribute('data-has-select-concept', 'true')
    })

    it('should pass correct props to Hierarchy when in full view mode', () => {
      render(
        <TreeView
          document={mockDocument}
          branchId="test-branch"
          inputComponent={false}
          selectConcept={() => undefined}
        />
      )

      const hierarchy = screen.getByTestId('hierarchy')

      // Should pass correct props to Hierarchy
      expect(hierarchy).toHaveAttribute('data-input-component', 'false')
      expect(hierarchy).toHaveAttribute('data-branch-id', 'test-branch')
    })
  })
})
