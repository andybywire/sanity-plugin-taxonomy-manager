import {useContext, useEffect} from 'react'
import {DocumentConcepts, TopConceptTerm, ChildConceptTerm} from '../types'
import {StyledTree} from '../styles'
import {TreeContext} from '../context'
import {TopConcepts} from './TopConcepts'
import {Orphans} from './Orphans'
import {NoConcepts} from './guides'

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
  inputComponent: Boolean
  selectConcept: any
}) => {
  const {
    globalVisibility: {treeId, treeVisibility} = {treeId: 123, treeVisibility: 'open'},
    setEditControls = () => {
      console.warn('setEditControls not defined')
    },
  } = useContext(TreeContext) || {}

  useEffect(() => {
    if (
      concepts?.topConcepts &&
      concepts.topConcepts.length === 0 &&
      concepts?.orphans &&
      concepts.orphans.length === 0
    )
      setEditControls(true)
  }, [concepts.topConcepts, concepts.orphans, setEditControls])

  if (
    concepts?.topConcepts &&
    concepts.topConcepts.length === 0 &&
    concepts?.orphans &&
    concepts.orphans.length === 0
  ) {
    return <NoConcepts />
  }

  return (
    <StyledTree>
      {concepts.topConcepts &&
        concepts.topConcepts.map((concept: TopConceptTerm) => {
          return (
            <TopConcepts
              key={concept?.id + treeId}
              concept={concept}
              treeVisibility={treeVisibility}
              inputComponent={inputComponent}
              selectConcept={selectConcept}
            />
          )
        })}
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
