import {createContext} from 'react'

type TreeContextType = {
  globalVisibility?: {treeId: string; treeVisibility: string}
  editControls?: boolean
  setEditControls?: (value: boolean) => void
}

export const SchemeContext = createContext(null)
export const TreeContext = createContext<TreeContextType>({editControls: false})
