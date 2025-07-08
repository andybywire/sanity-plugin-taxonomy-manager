import {useContext, useEffect} from 'react'

import {TreeContext} from '../context'
import {StyledTree} from '../styles'
import type {DocumentConcepts, TopConceptTerm, ChildConceptTerm} from '../types'

import {NoConcepts} from './guides'
import {Orphans} from './Orphans'
import {TopConcepts} from './TopConcepts'

/**
 * #### Tree View
 * - Fetches the complete tree of concepts in a concept scheme, stemming
 *   from Top Concepts or Orphans
 * - Displays the tree in a nested list.
 */
export const TreeStructure = ({
  concepts,
  inputComponent,
  selectConcept,
}: {
  concepts: DocumentConcepts
  inputComponent: boolean
  selectConcept: any
}) => {
  const {
    globalVisibility: {treeId, treeVisibility} = {treeId: 123, treeVisibility: 'open'},
    setEditControls = () => {
      console.warn('setEditControls not defined')
    },
  } = useContext(TreeContext) || {}

  useEffect(() => {
    if (concepts?.topConcepts?.length === 0 && concepts?.orphans?.length === 0)
      setEditControls(true)
  }, [concepts.topConcepts, concepts.orphans, setEditControls])

  if (concepts?.topConcepts?.length === 0 && concepts?.orphans?.length === 0) {
    return <NoConcepts />
  }

  return (
    <StyledTree>
      {concepts.topConcepts?.map((concept: TopConceptTerm) => (
        <TopConcepts
          key={concept?.id + treeId}
          concept={concept}
          treeVisibility={treeVisibility}
          inputComponent={inputComponent}
          selectConcept={selectConcept}
        />
      ))}
      {concepts.orphans.map((concept: ChildConceptTerm) => {
        return (
          <Orphans
            key={concept.id + treeId}
            concept={concept}
            treeVisibility={treeVisibility}
            inputComponent={inputComponent}
            selectConcept={selectConcept}
          />
        )
      })}
    </StyledTree>
  )
}
