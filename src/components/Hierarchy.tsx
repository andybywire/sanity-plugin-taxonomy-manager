/**
 * Concept Scheme Tree View
 * - Fetches the complete tree of concepts in a concept scheme.
 * - Displays the tree in a nested list.
 * @todo Investigate lag in rendering the correct tree. Consider checking against document.displayed and not changing state until _ids match.
 * @todo Anticipate and handle errors.
 * @todo Add functionality to expand/collapse the tree.
 * @todo Add direct linking to terms
 * @todo Add functionality to add a new term.
 */

import {Flex, Spinner, Text} from '@sanity/ui'
// import {SanityDocument} from '@sanity/client'
import {useListeningQuery} from 'sanity-plugin-utils'
import {TreeStructure} from './TreeStructure'
import {trunkBuilder} from './queries'
import {DocumentConcepts} from '../types'

export const Hierarchy = ({documentId}: {documentId: string}) => {
  const {data, loading, error} = useListeningQuery<DocumentConcepts>(trunkBuilder(), {
    params: {id: documentId},
    // initialValue: [],
  })
  if (loading) {
    return (
      <Flex
        align="center"
        direction="column"
        gap={5}
        height="fill"
        justify="center"
        style={{paddingTop: '1rem'}}
      >
        <Spinner muted />
        <Text muted size={1}>
          Loading hierarchy…
        </Text>
      </Flex>
    )
  } else if (error) {
    return <div>error: {error}</div>
  } else if (!data) {
    return <div>No data</div>
  }
  return <TreeStructure concepts={data} />
}

export default Hierarchy
