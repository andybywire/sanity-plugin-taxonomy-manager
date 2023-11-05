import {createContext} from 'react'

type TreeContextType = {
  globalVisibility?: {treeId: string; treeVisibility: string}
  editControls?: boolean
}

export const SchemeContext = createContext(null)
export const TreeContext = createContext<TreeContextType>({editControls: false})
