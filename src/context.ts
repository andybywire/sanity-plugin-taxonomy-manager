import {createContext} from 'react'

import type {ConceptInsert, RootConceptInsert} from './core/tree/insertConcept'
import type {ConceptMove} from './core/tree/moveConcept'
import type {TopConceptChange} from './core/tree/setTopConcept'
import type {ConceptSchemeDocument, DocumentConcepts, Options} from './types'

type TreeContextType = {
  globalVisibility?: {treeId: string; treeVisibility: 'open' | 'closed'}
  editControls?: boolean
  setEditControls?: (value: boolean) => void
  /**
   * The tree as currently rendered, including any optimistic edits. Rows read it
   * to decide whether a move is legal and to name the concepts involved, rather
   * than running a second query of their own. Only the structure Tree View
   * provides it; input trees never move anything.
   */
  concepts?: DocumentConcepts | null
  /**
   * Which concepts in the tree have a published version, or `null` while the
   * query is still in flight. Paired with each node's `_originalId` it gives the
   * row its publication status (see `core/publicationStatus`). Watched once for
   * the whole tree rather than per row, and left undefined wherever the markers
   * are gated off — input trees and release perspectives.
   */
  publishedIds?: ReadonlySet<string> | null
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
  markTopConcept: (change: TopConceptChange) => void
  unmarkTopConcept: (change: TopConceptChange) => void
  markInserted: (insert: ConceptInsert) => void
  unmarkInserted: (insert: ConceptInsert) => void
  markRootInserted: (insert: RootConceptInsert) => void
  unmarkRootInserted: (insert: RootConceptInsert) => void
}
export const OptimisticTreeContext = createContext<OptimisticTreeContextType>({
  markRemoved: () => undefined,
  unmarkRemoved: () => undefined,
  markMoved: () => undefined,
  unmarkMoved: () => undefined,
  markTopConcept: () => undefined,
  unmarkTopConcept: () => undefined,
  markInserted: () => undefined,
  unmarkInserted: () => undefined,
  markRootInserted: () => undefined,
  unmarkRootInserted: () => undefined,
})
