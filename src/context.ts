import {createContext} from 'react'

import type {ConceptSchemeDocument} from './components/TreeView'

type TreeContextType = {
  globalVisibility?: {treeId: string; treeVisibility: string}
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
