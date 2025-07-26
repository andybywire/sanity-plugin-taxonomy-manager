/* eslint-disable @typescript-eslint/no-explicit-any */
import {render, screen} from '@testing-library/react'
import {describe, it, expect, vi} from 'vitest'

import {ReleaseContext, SchemeContext} from '../context'
import type {ConceptSchemeDocument} from '../types'

import {Hierarchy} from './Hierarchy'

// Mock child components
vi.mock('./TreeStructure', () => ({
  TreeStructure: () => <div data-testid="tree-structure" />,
}))

vi.mock('./guides', () => ({
  NewScheme: () => <div data-testid="new-scheme" />,
}))

// Mock the useCreateConcept hook
vi.mock('../hooks', () => ({
  useCreateConcept: () => vi.fn(),
}))

// Mock Sanity UI components
vi.mock('@sanity/ui', () => ({
  Flex: ({children}: any) => <div data-testid="flex">{children}</div>,
  Spinner: () => <div data-testid="spinner" />,
  Stack: ({children}: any) => <div data-testid="stack">{children}</div>,
  Box: ({children}: any) => <div data-testid="box">{children}</div>,
  Text: ({children}: any) => <span data-testid="text">{children}</span>,
  Inline: ({children}: any) => <div data-testid="inline">{children}</div>,
  Card: ({children}: any) => <div data-testid="card">{children}</div>,
}))

// Mock the HierarchyButton
vi.mock('../styles', () => ({
  HierarchyButton: ({children, onClick}: any) => (
    <button type="button" data-testid="hierarchy-button" onClick={onClick}>
      {children}
    </button>
  ),
}))

// Mock the useListeningQuery hook to return a simple object
vi.mock('sanity-plugin-utils', () => ({
  useListeningQuery: () => ({
    data: {
      topConcepts: [],
      orphans: [],
    },
    loading: false,
    error: null,
  }),
}))

describe('Hierarchy', () => {
  it('should show add concept buttons when in draft mode', () => {
    const document = {
      displayed: {
        _id: 'drafts.abc123',
        _type: 'skosConceptScheme',
        title: 'Test Scheme',
      },
    }

    render(
      <SchemeContext.Provider value={document as ConceptSchemeDocument}>
        <ReleaseContext.Provider
          value={{
            isInRelease: false,
            documentId: 'drafts.abc123',
          }}
        >
          <Hierarchy branchId="" />
        </ReleaseContext.Provider>
      </SchemeContext.Provider>
    )

    // Should show add concept buttons in draft mode
    expect(screen.getByText('Add Top Concept')).toBeInTheDocument()
    expect(screen.getByText('Add Concept')).toBeInTheDocument()
  })

  it('should show add concept buttons when in release mode', () => {
    const document = {
      displayed: {
        _id: 'versions.r2024-01-15.abc123',
        _type: 'skosConceptScheme',
        title: 'Test Scheme',
      },
    }

    render(
      <SchemeContext.Provider value={document as ConceptSchemeDocument}>
        <ReleaseContext.Provider
          value={{
            isInRelease: true,
            releaseName: 'r2024-01-15',
            documentId: 'versions.r2024-01-15.abc123',
            versionId: 'versions.r2024-01-15.abc123',
          }}
        >
          <Hierarchy branchId="" />
        </ReleaseContext.Provider>
      </SchemeContext.Provider>
    )

    // Should show add concept buttons in release mode
    expect(screen.getByText('Add Top Concept')).toBeInTheDocument()
    expect(screen.getByText('Add Concept')).toBeInTheDocument()
  })

  it('should not show add concept buttons when in published mode', () => {
    const document = {
      displayed: {
        _id: 'abc123',
        _type: 'skosConceptScheme',
        title: 'Test Scheme',
      },
    }

    render(
      <SchemeContext.Provider value={document as ConceptSchemeDocument}>
        <ReleaseContext.Provider value="published">
          <Hierarchy branchId="" />
        </ReleaseContext.Provider>
      </SchemeContext.Provider>
    )

    // Should not show add concept buttons in published mode
    expect(screen.queryByText('Add Top Concept')).not.toBeInTheDocument()
    expect(screen.queryByText('Add Concept')).not.toBeInTheDocument()
  })
})
