import {createContext, useContext} from 'react'
import type {ReactElement, ReactNode} from 'react'

import type {TaxonomyDataPort} from '../core/ports'

import {studioDataAdapter} from './StudioDataAdapter'

/**
 * #### Taxonomy Port Context
 * Carries the active `TaxonomyDataPort`. The default is the real
 * `StudioDataAdapter`, so production renders need **no provider mounted** —
 * which matters because Sanity mounts our Tree View (structure) and our field
 * inputs (document forms) in separate trees with no shared root we own.
 *
 * Tests inject an in-memory fake:
 * `<TaxonomyPortProvider port={createFakeDataPort({tree})}>…</TaxonomyPortProvider>`.
 */
const TaxonomyPortContext = createContext<TaxonomyDataPort>(studioDataAdapter)

export function TaxonomyPortProvider({
  port,
  children,
}: {
  port: TaxonomyDataPort
  children: ReactNode
}): ReactElement {
  return <TaxonomyPortContext.Provider value={port}>{children}</TaxonomyPortContext.Provider>
}

/** Read the active data port (default: `StudioDataAdapter`). */
export function useTaxonomyDataPort(): TaxonomyDataPort {
  return useContext(TaxonomyPortContext)
}
