import {createContext} from 'react'

type TreeContextType = {
  globalVisibility?: {treeId: string; treeVisibility: string}
  editControls?: boolean
  setEditControls?: (value: boolean) => void
}

export type ReleaseContextType = {
  isInRelease: boolean
  releaseName?: string
  documentId: string
  versionId?: string
}

export const SchemeContext = createContext(null)
export const TreeContext = createContext<TreeContextType>({editControls: false})
export const ReleaseContext = createContext<ReleaseContextType>({
  isInRelease: false,
  documentId: '',
})
