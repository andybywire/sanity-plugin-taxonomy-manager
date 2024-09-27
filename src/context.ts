import {createContext} from 'react'

type TreeContextType = {
  globalVisibility?: {treeId: string; treeVisibility: string}
}

export const SchemeContext = createContext(null)
export const TreeContext = createContext<TreeContextType>({})
