/**
 * Concept Scheme Tree View
 * - Fetches the complete tree of concepts in a concept scheme.
 * - Displays the tree in a nested list.
 * @todo Add functionality to expand/collapse the tree.
 */

import {StyledTree} from '../styles'
import {DocumentConcepts, TopConceptTerm, ChildConceptTerm} from '../types'
import {TopConcepts} from './TopConcepts'
import {Orphans} from './Orphans'
import {NoConcepts} from './guides'

export const TreeStructure = ({concepts}: {concepts: DocumentConcepts}) => {
  if (concepts.topConcepts === null && concepts.orphans.length === 0) return <NoConcepts />

  return (
    <StyledTree>
      {concepts.topConcepts &&
        concepts.topConcepts.map((concept: TopConceptTerm) => {
          return <TopConcepts key={concept?.id} concept={concept} />
        })}
      {concepts.orphans.map((concept: ChildConceptTerm) => {
        return <Orphans key={concept.id} concept={concept} />
      })}
    </StyledTree>
  )
}
