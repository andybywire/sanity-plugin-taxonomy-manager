import {render} from '@testing-library/react'
import {useContext, type ReactNode} from 'react'
import {describe, it, expect, vi, beforeEach} from 'vitest'

import {ReleaseContext, type ReleaseContextType} from '../context'

import {TreeView} from './TreeView'

// Create a test component that captures the context
let capturedContext: ReleaseContextType | null = null

const ContextCapture = () => {
  const context = useContext(ReleaseContext)
  capturedContext = context
  return <div data-testid="context-capture" />
}

// Mock Sanity UI components
vi.mock('@sanity/ui', () => ({
  // eslint-disable-next-line react/require-default-props
  Container: ({children}: {children?: ReactNode}) => <div data-testid="container">{children}</div>,
  // eslint-disable-next-line react/require-default-props
  Box: ({children}: {children?: ReactNode}) => <div data-testid="box">{children}</div>,
  // eslint-disable-next-line react/require-default-props
  Stack: ({children}: {children?: ReactNode}) => <div data-testid="stack">{children}</div>,
  // eslint-disable-next-line react/require-default-props
  Text: ({children}: {children?: ReactNode}) => <span data-testid="text">{children}</span>,
}))

// Mock child components to render our context capture
vi.mock('./Hierarchy', () => ({
  Hierarchy: () => <ContextCapture />,
  default: () => <ContextCapture />,
}))

vi.mock('./inputs', () => ({
  InputHierarchy: () => <ContextCapture />,
}))

describe('TreeView', () => {
  beforeEach(() => {
    capturedContext = null
  })

  it('should provide ReleaseContext with correct values for published document', () => {
    const document = {
      _id: 'abc123',
      _rev: 'rev123',
      _type: 'skosConceptScheme' as const,
      _createdAt: '2024-01-01T00:00:00Z',
      _updatedAt: '2024-01-01T00:00:00Z',
      displayed: {
        _id: 'abc123',
        _type: 'skosConceptScheme' as const,
        title: 'Test Scheme',
      },
    }

    // eslint-disable-next-line react/jsx-no-bind
    render(<TreeView document={document} branchId="" selectConcept={() => undefined} />)

    expect(capturedContext).toEqual({
      isInRelease: false,
      documentId: 'abc123',
    })
  })

  it('should provide ReleaseContext with correct values for versioned document', () => {
    const document = {
      _id: 'abc123',
      _rev: 'rev123',
      _type: 'skosConceptScheme' as const,
      _createdAt: '2024-01-01T00:00:00Z',
      _updatedAt: '2024-01-01T00:00:00Z',
      displayed: {
        _id: 'versions.r2024-01-15.abc123',
        _type: 'skosConceptScheme' as const,
        title: 'Test Scheme',
      },
    }

    // eslint-disable-next-line react/jsx-no-bind
    render(<TreeView document={document} branchId="" selectConcept={() => undefined} />)

    expect(capturedContext).toEqual({
      isInRelease: true,
      releaseName: 'r2024-01-15',
      documentId: 'versions.r2024-01-15.abc123',
      versionId: 'versions.r2024-01-15.abc123',
    })
  })
})
