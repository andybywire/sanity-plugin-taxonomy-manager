/**
 * Concept Scheme Tree View
 * - Fetches the complete tree of concepts in a concept scheme.
 * - Displays the tree in a nested list.
 * @todo Investigate lag in rendering the updated tree. Prefer a loading state over old data.
 * @todo Add functionality to expand/collapse the tree.
 * @todo Add direct linking to terms
 * @todo Add functionality to add a new term.
 */

import {Card, Flex, Label, Spinner, Stack, Text} from '@sanity/ui'
import {useListeningQuery} from 'sanity-plugin-utils'
import {TreeStructure} from './TreeStructure'
import {trunkBuilder} from './queries'
import {DocumentConcepts} from '../types'

export const Hierarchy = ({documentId}: {documentId: string}) => {
  const {data, loading, error} = useListeningQuery<DocumentConcepts>(
    {
      fetch: trunkBuilder(),
      listen: `*[_type == "skosConcept"]`,
      // ⬇ this is more precise, but also appears to be unreliable
      // listen: `*[_type == "skosConcept" && _id in *[_id == $id].topConcepts[]._ref]`,
      // consider also the need to eventually include the skosConceptScheme doc in the query
    },
    {
      params: {id: documentId},
    }
  )
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
    return (
      <Card padding={4}>
        <Card padding={[3, 3, 4]} radius={2} shadow={1} tone="primary">
          <Stack space={3}>
            <Label size={3}>New Concept Scheme</Label>
            <Text size={2}>
              To get started with this scheme, go to the "Editor" tab, give the scheme a title, and
              then start adding concepts.
            </Text>
          </Stack>
        </Card>
      </Card>
    )
  }
  return <TreeStructure concepts={data} />
}

export default Hierarchy
