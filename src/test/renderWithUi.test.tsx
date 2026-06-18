import {Text} from '@sanity/ui'
import {screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {renderWithUi} from './renderWithUi'

// Smoke test for the whole harness: vitest + jsdom + esbuild JSX +
// test-setup (matchMedia/jest-dom) + the @sanity/ui provider stack.
describe('test harness', () => {
  it('renders a @sanity/ui component inside the provider stack', () => {
    renderWithUi(<Text>taxonomy harness ok</Text>)
    expect(screen.getByText('taxonomy harness ok')).toBeInTheDocument()
  })
})
