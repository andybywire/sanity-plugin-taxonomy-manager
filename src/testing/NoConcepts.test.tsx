import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {NoConcepts} from '../components/guides/NoConcepts'

describe('NoConcepts', () => {
  it('should render the component with correct content', () => {
    render(<NoConcepts />)

    // Check for the main label
    expect(screen.getByText('No Concepts')).toBeInTheDocument()

    // Check for the descriptive text
    expect(
      screen.getByText(/There are not yet any concepts assigned to this scheme/)
    ).toBeInTheDocument()
    expect(screen.getByText(/To create a multi-level hierarchy/)).toBeInTheDocument()
    expect(screen.getByText(/To create a flat list of concepts/)).toBeInTheDocument()
  })

  it('should render with proper structure', () => {
    const {container} = render(<NoConcepts />)

    // Check that the component renders without errors
    expect(container.firstChild).toBeInTheDocument()
  })

  it('should be accessible', () => {
    render(<NoConcepts />)

    // Check that the text is readable by screen readers
    expect(screen.getByText('No Concepts')).toBeInTheDocument()
    expect(screen.getByText(/There are not yet any concepts/)).toBeInTheDocument()
  })
})
