import {Box, Stack} from '@sanity/ui'
import {useContext} from 'react'

import {TreeContext} from '../context'
import type {DocumentConcepts, TopConceptTerm, ChildConceptTerm} from '../types'

import {Concepts} from './Concepts'
import {NoConcepts} from './guides'
import {TopConcepts} from './TopConcepts'

/**
 * #### Tree View
 * Fetches the complete tree of concepts in a concept scheme, stemming
 * from Top Concepts or Orphans. Displays the tree in a nested list.
 */
export const TreeStructure = ({
  concepts,
  inputComponent,
  selectConcept,
}: {
  concepts: DocumentConcepts
  inputComponent: boolean
  selectConcept: (conceptId: {_ref: string; _type: 'reference'; _originalId?: string}) => void
}) => {
  const {globalVisibility: {treeId, treeVisibility} = {treeId: 123, treeVisibility: 'open'}} =
    useContext(TreeContext) || {}

  if (!concepts?.topConcepts?.length && !concepts?.concepts?.length) {
    return <NoConcepts />
  }

  return (
    // <ul className={styles.treeStructure}>
    <Box paddingTop={4}>
      <Stack space={3} style={{listStyle: 'none', paddingLeft: '0', marginBlockStart: '0'}}>
        {concepts.topConcepts?.map((concept: TopConceptTerm) => (
          <TopConcepts
            key={`${concept?.id}+${treeId}`}
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
                key={`${concept.id}+${treeId}`}
                concept={concept}
                treeVisibility={treeVisibility}
                inputComponent={inputComponent}
                selectConcept={selectConcept}
              />
            )
          })}
      </Stack>
    </Box>
    // {/* </ul> */}
  )
}
