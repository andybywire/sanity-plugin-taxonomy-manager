import {vi} from 'vitest'

import type {ArrayHierarchyInput} from '../components/inputs/ArrayHierarchyInput'
import type {ReferenceHierarchyInput} from '../components/inputs/ReferenceHierarchyInput'

/**
 * Shared fixtures for the input-component jsdom tests. The components read Studio
 * primitives (`useClient`/`useFormValue`/`usePerspective`, `FormField`) that each
 * test file stubs via `vi.mock('sanity', …)`; this module supplies the bulky,
 * mock-independent pieces: a chainable client stub and field-props factories.
 */

/** A Studio client stub that resolves the scheme lookup and no-ops mutations. */
export function fakeSchemeClient(
  scheme: Record<string, unknown> = {_id: 'scheme-x', _type: 'skosConceptScheme', title: 'Test Scheme'}
) {
  const client: Record<string, unknown> = {
    withConfig: () => client,
    fetch: vi.fn().mockResolvedValue({displayed: scheme}),
    patch: vi.fn(() => client),
    set: vi.fn(() => client),
    setIfMissing: vi.fn(() => client),
    append: vi.fn(() => client),
    commit: vi.fn().mockResolvedValue(undefined),
    create: vi.fn().mockResolvedValue(undefined),
    transaction: vi.fn(() => client),
  }
  return client as unknown as ReturnType<typeof import('sanity').useClient>
}

/**
 * A resolved field filter. Real `schemeFilter()`/`branchFilter()` resolve to a
 * single-argument function; the components treat a zero-arity filter as
 * misconfigured (`filter.length === 0`), so this keeps arity 1.
 */
export const filterFor =
  (params: Record<string, unknown>, extra: Record<string, unknown> = {}) =>
  (_opts: unknown) =>
    Promise.resolve({filter: 'scheme-filter', params, ...extra})

const sharedProps = {
  level: 0,
  value: undefined,
  validation: [],
  presence: [],
  renderDefault: () => <div data-testid="default-input">default input</div>,
}

/** Minimal `ReferenceHierarchyInput` props; `renderDefault` renders a recognizable marker. */
export function referenceFieldProps(overrides: Record<string, unknown> = {}) {
  return {
    ...sharedProps,
    name: 'subject',
    title: 'Subject',
    path: ['subject'],
    schemaType: {options: {filter: filterFor({schemeId: 'scheme-x'})}},
    ...overrides,
  } as unknown as Parameters<typeof ReferenceHierarchyInput>[0]
}

/** Minimal `ArrayHierarchyInput` props; the filter lives on `of[0].options`. */
export function arrayFieldProps(overrides: Record<string, unknown> = {}) {
  return {
    ...sharedProps,
    name: 'topics',
    title: 'Topics',
    path: ['topics'],
    schemaType: {of: [{options: {filter: filterFor({schemeId: 'scheme-x'})}}]},
    ...overrides,
  } as unknown as Parameters<typeof ArrayHierarchyInput>[0]
}
