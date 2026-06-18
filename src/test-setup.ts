import '@testing-library/jest-dom/vitest'

import {cleanup, configure} from '@testing-library/react'
import {afterEach} from 'vitest'

// CI runners (Linux especially) can be several times slower than local; give
// findBy*/waitFor assertions headroom so async UI doesn't flake.
configure({asyncUtilTimeout: 5000})

// Vitest runs with globals: false, so Testing Library's automatic cleanup does
// not fire. Clean the rendered DOM after each test to avoid query collisions.
afterEach(() => cleanup())

// jsdom does not implement matchMedia; @sanity/ui's responsive hooks call it.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

// jsdom does not implement ResizeObserver; some @sanity/ui primitives use it.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  } as unknown as typeof ResizeObserver
}
