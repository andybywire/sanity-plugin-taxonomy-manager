/**
 * Concept Scheme Tree View
 * - Fetches the complete tree of concepts in a concept scheme.
 * - Displays the tree in a nested list.
 */

import {useContext} from 'react'
import {StyledTree} from '../styles'
import {DocumentConcepts, TopConceptTerm, ChildConceptTerm} from '../types'
import {TreeContext} from './Hierarchy'
import {TopConcepts} from './TopConcepts'
import {Orphans} from './Orphans'
import {NoConcepts} from './guides'

export const TreeStructure = ({concepts}: {concepts: DocumentConcepts}) => {
  // @ts-expect-error I think this is the same complier issue as Hierarchy.tsx
  // To investigate.
  const {treeId, treeVisibility} = useContext(TreeContext)

  if (concepts.topConcepts === null && concepts.orphans.length === 0) return <NoConcepts />

  return (
    <StyledTree>
      {concepts.topConcepts &&
        concepts.topConcepts.map((concept: TopConceptTerm) => {
          return (
            <TopConcepts
              key={concept?.id + treeId}
              concept={concept}
              treeVisibility={treeVisibility}
            />
          )
        })}
      {concepts.orphans.map((concept: ChildConceptTerm) => {
        return <Orphans key={concept.id + treeId} concept={concept} />
      })}
    </StyledTree>
  )
}
