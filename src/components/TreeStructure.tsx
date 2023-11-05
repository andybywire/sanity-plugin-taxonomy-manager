/**
 * Tree View
 * - Fetches the complete tree of concepts in a concept scheme, stemming
 *   from Top Concepts or Orphans
 * - Displays the tree in a nested list.
 */

import {useContext} from 'react'
import {DocumentConcepts, TopConceptTerm, ChildConceptTerm} from '../types'
import {StyledTree} from '../styles'
import {TreeContext} from '../context'
import {TopConcepts} from './TopConcepts'
import {InputTopConcepts} from './inputs/hierarchy/InputTopConcepts'
import {Orphans} from './Orphans'
import {InputOrphans} from './inputs/hierarchy/InputOrphans'
import {NoConcepts} from './guides'

export const TreeStructure = ({
  concepts,
  inputComponent,
  selectConcept,
}: {
  concepts: DocumentConcepts
  inputComponent: Boolean
  selectConcept: any
}) => {
  const {globalVisibility: {treeId, treeVisibility} = {treeId: 123, treeVisibility: 'open'}} =
    useContext(TreeContext) || {}

  if (concepts.topConcepts === null && concepts.orphans.length === 0) return <NoConcepts />

  return (
    <StyledTree>
      {concepts.topConcepts &&
        concepts.topConcepts.map((concept: TopConceptTerm) => {
          if (inputComponent) {
            return (
              <InputTopConcepts
                key={concept?.id + treeId}
                concept={concept}
                treeVisibility={treeVisibility}
                inputComponent={inputComponent}
                selectConcept={selectConcept}
              />
            )
          }
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
        if (inputComponent) {
          return (
            <InputOrphans
              key={concept.id + treeId}
              concept={concept}
              treeVisibility={treeVisibility}
              inputComponent={inputComponent}
              selectConcept={selectConcept}
            />
          )
        }
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
