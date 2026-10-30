import {createContext} from 'react'

import type {ConceptMove} from './core/tree/moveConcept'
import type {ConceptSchemeDocument, Options} from './types'

type TreeContextType = {
  globalVisibility?: {treeId: string; treeVisibility: 'open' | 'closed'}
  editControls?: boolean
  setEditControls?: (value: boolean) => void
}

export const SchemeContext = createContext<ConceptSchemeDocument | null>(null)
export const TreeContext = createContext<TreeContextType>({editControls: false})

/**
 * The active perspective name from `usePerspective().selectedPerspectiveName`
 * (provided by TreeView): `undefined` for the default drafts view, otherwise a
 * release name or `'published'`. Drives perspective-aware queries and the gating
 * of edit controls.
 */
export const ReleaseContext = createContext<string | undefined>(undefined)

/**
 * Plugin config the render tree needs at runtime. Provided around the structure
 * Tree View (see `createDefaultDocumentNode`); replaces the old `config.ts`
 * `getPluginConfig` singleton. Defaults to empty so input-component trees (which
 * never create concepts) render correctly without a provider.
 */
export type TaxonomyConfig = {ident?: Options['ident']}
export const TaxonomyConfigContext = createContext<TaxonomyConfig>({})

/**
 * Connects the deep edit actions to Hierarchy's optimistic layer: removing a
 * concept marks its id so the tree prunes it instantly, and moving one records
 * the edge so the tree re-parents it instantly, both ahead of the live listener
 * catching up (see Hierarchy, core/tree/pruneConcepts and core/tree/moveConcept).
 * Each mark is paired with an unmark, used to roll the tree back when the
 * mutation fails. Defaults to no-ops, so trees rendered without the provider —
 * the input components, which never edit — behave normally.
 */
export type OptimisticTreeContextType = {
  markRemoved: (id: string) => void
  unmarkRemoved: (id: string) => void
  markMoved: (move: ConceptMove) => void
  unmarkMoved: (move: ConceptMove) => void
}
export const OptimisticTreeContext = createContext<OptimisticTreeContextType>({
  markRemoved: () => undefined,
  unmarkRemoved: () => undefined,
  markMoved: () => undefined,
  unmarkMoved: () => undefined,
})
