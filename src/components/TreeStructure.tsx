import {Box, Stack} from '@sanity/ui'
import {useContext} from 'react'

import {TreeContext} from '../context'
import {rootOrphans} from '../core/tree/rootOrphans'
import type {DocumentConcepts, TopConceptTerm, ChildConceptTerm} from '../types'

import {ConceptRow} from './ConceptRow'
import {NoConcepts} from './guides'

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
  concepts: DocumentConcepts | null
  inputComponent: boolean
  selectConcept: (conceptId: {_ref: string; _type: 'reference'; _originalId?: string}) => void
}) => {
  // Rows read their own visibility from context; only the id is needed here,
  // to remount every root row — and so the whole tree — on expand or collapse.
  const {globalVisibility: {treeId} = {treeId: 'default'}} = useContext(TreeContext) || {}

  if (!concepts?.topConcepts?.length && !concepts?.concepts?.length) {
    return <NoConcepts />
  }

  return (
    <Box paddingTop={4}>
      <Stack gap={3} style={{listStyle: 'none', paddingLeft: '0', marginBlockStart: '0'}}>
        {concepts?.topConcepts?.map((concept: TopConceptTerm) => (
          <ConceptRow
            key={`${concept?.id}+${treeId}`}
            concept={concept}
            kind="top"
            parentId={null}
            inputComponent={inputComponent}
            selectConcept={selectConcept}
          />
        ))}
        {rootOrphans(concepts).map((concept: ChildConceptTerm) => (
          <ConceptRow
            key={`${concept.id}+${treeId}`}
            concept={concept}
            kind="orphan"
            parentId={null}
            inputComponent={inputComponent}
            selectConcept={selectConcept}
          />
        ))}
      </Stack>
    </Box>
  )
}
