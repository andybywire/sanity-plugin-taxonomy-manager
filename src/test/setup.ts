import '@testing-library/jest-dom'
import {vi} from 'vitest'

// Mock Sanity client
vi.mock('@sanity/client', () => ({
  createClient: vi.fn(() => ({
    fetch: vi.fn(),
    listen: vi.fn(),
    withConfig: vi.fn(() => ({
      fetch: vi.fn(),
      listen: vi.fn(),
    })),
  })),
}))

// Mock Sanity UI components that might not be available in test environment
vi.mock('@sanity/ui', () => ({
  Box: ({children, ...props}: any) => {
    const React = require('react')
    return React.createElement('div', props, children)
  },
  Button: ({children, ...props}: any) => {
    const React = require('react')
    return React.createElement('button', {...props, type: 'button'}, children)
  },
  Card: ({children, ...props}: any) => {
    const React = require('react')
    return React.createElement('div', props, children)
  },
  Stack: ({children, ...props}: any) => {
    const React = require('react')
    return React.createElement('div', props, children)
  },
  Text: ({children, ...props}: any) => {
    const React = require('react')
    return React.createElement('span', props, children)
  },
  Label: ({children, ...props}: any) => {
    const React = require('react')
    return React.createElement('label', props, children)
  },
  useTheme: () => ({
    color: {
      base: {
        fgColor: '#000',
        bgColor: '#fff',
      },
    },
  }),
}))

// Mock React icons
vi.mock('react-icons', () => ({
  FiPlus: () => {
    const React = require('react')
    return React.createElement('span', {'data-testid': 'plus-icon'}, '+')
  },
  FiMinus: () => {
    const React = require('react')
    return React.createElement('span', {'data-testid': 'minus-icon'}, '-')
  },
  FiEdit: () => {
    const React = require('react')
    return React.createElement('span', {'data-testid': 'edit-icon'}, '✏️')
  },
  FiTrash: () => {
    const React = require('react')
    return React.createElement('span', {'data-testid': 'trash-icon'}, '🗑️')
  },
}))

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
