import {createContext} from 'react'

import type {ConceptSchemeDocument, Options} from './types'

type TreeContextType = {
  globalVisibility?: {treeId: string; treeVisibility: 'open' | 'closed'}
  editControls?: boolean
  setEditControls?: (value: boolean) => void
}

export type ReleaseContextType = {
  isPublished?: boolean
  isInRelease: boolean
  releaseName?: string
  documentId: string
  versionId?: string
}

export const SchemeContext = createContext<ConceptSchemeDocument | null>(null)
export const TreeContext = createContext<TreeContextType>({editControls: false})
// export const ReleaseContext = createContext<ReleaseContextType>({
//   isInRelease: false,
//   documentId: '',
// })
export const ReleaseContext = createContext<any>(undefined)

/**
 * Plugin config the render tree needs at runtime. Provided around the structure
 * Tree View (see `createDefaultDocumentNode`); replaces the old `config.ts`
 * `getPluginConfig` singleton. Defaults to empty so input-component trees (which
 * never create concepts) render correctly without a provider.
 */
export type TaxonomyConfig = {ident?: Options['ident']}
export const TaxonomyConfigContext = createContext<TaxonomyConfig>({})

/**
 * Connects the deep remove actions to Hierarchy's optimistic-removal layer:
 * removing a concept marks its id so the tree prunes it instantly, ahead of the
 * live listener catching up (see Hierarchy + core/tree/pruneConcepts). Defaults
 * to no-ops, so trees rendered without the provider — the input components,
 * which never remove — behave normally.
 */
export type OptimisticTreeContextType = {
  markRemoved: (id: string) => void
  unmarkRemoved: (id: string) => void
}
export const OptimisticTreeContext = createContext<OptimisticTreeContextType>({
  markRemoved: () => undefined,
  unmarkRemoved: () => undefined,
})
