/**
 * Concept Scheme Tree View
 * - Fetches the complete tree of concepts in a concept scheme.
 * - Displays the tree in a nested list.
 * @todo Add functionality to expand/collapse the tree.
 */

import {hues} from '@sanity/color'
import {Orphans} from './Orphans'
import {TopConceptTerm, ChildConceptTerm} from '../types'
import {TopConcepts} from './TopConcepts'
import {NoConcepts} from './guides'
import styled from 'styled-components'

const StyledTree = styled.ul`
  list-style: none;
  padding-left: 0;
  margin-block-start: 0;
  li svg {
    height: 1.2rem;
    width: 1.2rem;
    color: ${hues.gray[800].hex};
    border-radius: 3px;
    transition: all 0.2s ease-in-out;
    &.normal:hover {
      color: ${hues.gray[100].hex};
      background-color: ${hues.green[500].hex};
    }
    &.warning:hover {
      color: ${hues.gray[100].hex};
      background-color: ${hues.yellow[500].hex};
    }
    &.error {
      color: ${hues.red[500].hex};
    }
    &.error:hover,
    &.critical:hover {
      color: ${hues.gray[100].hex};
      background-color: ${hues.red[500].hex};
    }
  }
`

export const TreeStructure = (data: any) => {
  const {concepts} = data
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
