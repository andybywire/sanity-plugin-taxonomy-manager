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

import React, {useState, useEffect} from 'react'
import {Box, Stack, Text} from '@sanity/ui'
import {withParent} from 'part:@sanity/form-builder'
import sanityClient from 'part:@sanity/base/client'
import * as s from './treeView.module.css'

const client = sanityClient.withConfig({apiVersion: '2021-03-25'})

// This component builds the hierarchy tree, messages loading state, messages no concepts found state.
const RecursiveConcept = (props) => {
  return (
    <>
      {props.isError && <p>Sorry, could not get concepts.</p>}
      {props.noConcept && <p>This scheme does not yet have any concepts assigned to it.</p>}
      {props.isLoading ? (
        <p>Loading hierarchy ...</p>
      ) : (
        <ul className='skosTreeView'>
          {props.concepts.map((concept) => {
            return (
              <li
                key={concept.id}
                className={`${concept.topConcept ? s.topConcept : s.orphan} ${
                  concept.broaderSchemas?.filter((id) => id === concept.parentScheme).length > 1 &&
                  s.polyHier
                }`}
              >
                {concept.prefLabel}
                {concept.narrower?.length > 0 && <RecursiveConcept concepts={concept.narrower} />}
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}

const TreeView = withParent(
  
  // Not using the ref right now, but likely will when the tree becomes interactive. 
  React.forwardRef((props, ref) => {
    const [concepts, setConcepts] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [noConcept, setNoConcept] = useState(false)
    const [isError, setIsError] = useState(false)

    const conceptScheme = props.parent._id ? props.parent._id.replace('drafts.', '') : undefined
    // This function builds the first level of hierarchy, noting Top Concepts and orphans, then calls the recursiveQuery() function
    const queryBuilder = (depth = 5) => {
      if (depth === 0) {
        return ''
      } else {
        return `*[_type=="skosConcept" && references($conceptScheme) && (count(broader[]) < 1 || broader == null) && !(_id in path("drafts.**"))]|order(prefLabel) {
        "level": 0,
        "id": _id,
        prefLabel,
        topConcept,
          ${recursiveQuery(depth)}
        }`
      }
    }
    // This function builds all subsequent levels found in the data and notes any concepts that exist in two places in this Concept Scheme (i.e. which are polyhierarchical)
    const recursiveQuery = (depth, count = 1) => {
      if (depth === 0) {
        return ''
      } else {
        return `"narrower": *[_type == "skosConcept" && references($conceptScheme) && references(^._id) && !(_id in path("drafts.**"))]|order(prefLabel) {
          "level": ${count},
          "id": _id,
          prefLabel,
          "broaderSchemas": broader[]->scheme->._id, 
          "parentScheme": $conceptScheme, ${recursiveQuery(depth - 1, count + 1)} 
        }`
      }
    }

    useEffect(() => {
      const fetchConcepts = async () => {
        
        if (props.parent._id === undefined ) return

        setIsError(false)
        setNoConcept(false)
        setIsLoading(true)
        try {
          const params = {conceptScheme: conceptScheme}
          const query = `${queryBuilder()}`
          const response = await client.fetch(query, params)
          if (response.length < 1) {
            setNoConcept(true)
            setIsError(false)
          }
          setConcepts(response)
        } catch (error) {
          setIsError(true)
          console.log(error)
        }
        setIsLoading(false)
      }
      fetchConcepts()
    }, [props.parent._id])

    return (
      <Box>
        <Stack space={2}>
          <Text size={1} weight="semibold">
            {props.type.title}
          </Text>
          <Text size={1} muted>
            {props.type.description}
          </Text>
          <Text size={2}>
            <RecursiveConcept
              concepts={concepts}
              isLoading={isLoading}
              noConcept={noConcept}
              isError={isError}
            />
          </Text>
        </Stack>
      </Box>
    )
  })
)

export default TreeView
