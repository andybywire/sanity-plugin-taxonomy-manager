/**
 * Taxonomy Tree View input component for SKOS Concept Schemes
 * This component creates a hierarchical, linked (TDB) display of concepts associated with the associated Concept Scheme
 * @todo Add ability to set hierarchy depth from config file
 * @todo Add links to concepts that open in a pane to the right (see notes below)
 * @todo Add affordance for collapsing and expanding tree view (see notes below)
 * @todo Add affordance for creating new child concept in pane to the right (or modal) from a tree view concept
 * @todo Differentiate "new concept scheme" error state from other fetch() error states
 * @todo Add listener to JS client to reflect hierarchy updates as they happen: https://www.sanity.io/plugins/javascript-api-client
 */

import {useState, useEffect} from 'react'
import {Box, Stack, Text} from '@sanity/ui'
import { useClient, useFormValue } from 'sanity'
// import * as s from './treeView.module.css'


// TreeView JSX component
export function TreeView(props) {
  
  const [concepts, setConcepts] = useState("Initial concept value.")

  const conceptScheme = useFormValue(['title'])
  
  const client = useClient().withConfig({apiVersion: '2021-10-21'})

  useEffect(() => {
    const fetchConcepts = async () => {
    
      const response = await client.fetch(`*[_type=="skosConcept" && references("61c77551-6776-4aea-8b6e-0c1e1175cc25")][0]
        {prefLabel}`)
      const label = response.prefLabel
      setConcepts(label)
      }
    fetchConcepts()
  }, [])

  return (
    <Box>
      <Stack space={2}>
        <Text size={1} weight="semibold">
          Title
          {/* {props.type.title} */}
        </Text>
        <Text size={1} muted>
          Description
          {/* {props.type.description} */}
        </Text>
        <Text size={2}>
          Concepts
          <pre>{concepts}</pre>
        </Text>
      </Stack>
    </Box>
  )
}


export default TreeView
