import {useContext, useEffect} from 'react'

import {TreeContext} from '../context'
import {StyledTree} from '../styles'
import type {DocumentConcepts, TopConceptTerm, ChildConceptTerm} from '../types'

import {Concepts} from './Concepts'
import {NoConcepts} from './guides'
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
  selectConcept: (conceptId: string) => void
}) => {
  const {
    globalVisibility: {treeId, treeVisibility} = {treeId: 123, treeVisibility: 'open'},
    setEditControls = () => {
      console.warn('setEditControls not defined')
    },
  } = useContext(TreeContext) || {}

  useEffect(() => {
    if (concepts?.topConcepts?.length === 0 && concepts?.concepts?.length === 0)
      setEditControls(true)
  }, [concepts.topConcepts, concepts.concepts, setEditControls])

  if (concepts?.topConcepts?.length === 0 && concepts?.concepts?.length === 0) {
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
      {concepts.concepts
        ?.filter((concept: ChildConceptTerm) => concept?.isOrphan)
        .map((concept: ChildConceptTerm) => {
          return (
            <Concepts
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
