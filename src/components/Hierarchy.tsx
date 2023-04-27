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

import {Flex, Spinner, Text, Inline} from '@sanity/ui'
import {TopConceptTerms, ChildConceptTerms} from '../types'
import {SanityDocument} from '@sanity/client'
import {useListeningQuery} from 'sanity-plugin-utils'
import {ChildConcepts} from './ChildConcepts'
import {TopConcepts} from './TopConcepts'

// Recursive function to build out successive branches of the hierarchy up to five levels deep.
// - Get the prefLabel and _id of each concept in the array of concepts referenced by the broader term,
//   then repeat the process for each of those concepts, and so on.
// - Run tree to a depth of 6 levels. Return 5. If there is a 6th, do no return it; return a message.
// - @todo: Detect when a 6th level is present and print a message in the UI.
const branchBuilder = (level = 1): string | void => {
  if (level > 6) {
    return ''
  }
  return `"childConcepts": *[_id in coalesce(*[_id == 'drafts.' + $id][0], *[_id == $id][0]).concepts[]._ref && ^._id in broader[]._ref ]|order(prefLabel){
      "id": _id,
      "level": ${level},
      prefLabel,
      ${branchBuilder(level + 1)}
    }`
}

// Build the query to fetch the top concepts and their child concepts and orphans and their child concepts.
// - To get orphans: filter to concepts in this scheme only, then filter out concepts that reference a topConcept in this scheme as a broader term, then filter out concepts that reference other concepts in this scheme as a broader term
// coalesce() returns the first non-null value in the list of arguments, so either the draft or the published concept.
const trunkBuilder = (): string => {
  return `coalesce(*[_id == 'drafts.' + $id][0], *[_id == $id][0]) {
    _updatedAt,
    "topConcepts":topConcepts[]->|order(prefLabel){
      "id": _id,
      "level": 0,
      prefLabel,
      ${branchBuilder()}
    },
    "orphans": *[
      _id in coalesce(*[_id == 'drafts.' + $id][0], *[_id == $id][0]).concepts[]._ref &&
      count((broader[]._ref) [@ in coalesce(*[_id == 'drafts.' + $id][0], *[_id == $id][0]).topConcepts[]._ref]) < 1 &&
      count((broader[]._ref) [@ in coalesce(*[_id == 'drafts.' + $id][0], *[_id == $id][0]).concepts[]._ref]) < 1
    ]|order(prefLabel){
      "id": _id,
      "level": 0,
      prefLabel,
      ${branchBuilder()}
    }
  }`
}

const TreeStructure = ({concepts}: {concepts: any}) => {
  return (
    <ul style={{listStyle: 'none', paddingLeft: '0', marginTop: '1rem'}}>
      {concepts.topConcepts &&
        concepts.topConcepts.map((concept: TopConceptTerms) => {
          return (
            <TopConcepts key={concept?.id} concept={concept} />
            // <li
            //   key={concept?.id}
            //   style={{paddingTop: '.5rem', fontWeight: 'bold', marginTop: '.75rem'}}
            // >
            //   <Inline space={2} onResize={undefined} onResizeCapture={undefined}>
            //     {concept?.prefLabel}
            //     <Text size={1} muted onResize={undefined} onResizeCapture={undefined}>
            //       top concept
            //     </Text>
            //   </Inline>
            //   {concept?.childConcepts && concept.childConcepts.length > 0 && (
            //     <ChildConcepts concepts={concept.childConcepts} />
            //   )}
            // </li>
          )
        })}
      {concepts.orphans.map((concept: ChildConceptTerms) => {
        return (
          <li
            key={concept.id}
            style={{paddingTop: '.5rem', fontWeight: 'normal', marginTop: '.75rem'}}
          >
            <Inline space={2} onResize={undefined} onResizeCapture={undefined}>
              {concept?.prefLabel}
              {concepts.topConcept?.length > 0 && (
                <Text size={1} muted onResize={undefined} onResizeCapture={undefined}>
                  orphan
                </Text>
              )}
            </Inline>
            {concept?.childConcepts && concept.childConcepts.length > 0 && (
              <ChildConcepts concepts={concept.childConcepts} />
            )}
          </li>
        )
      })}
    </ul>
  )
}

export const Hierarchy = ({documentId}: {documentId: string}) => {
  const {data, loading, error} = useListeningQuery<SanityDocument[]>(trunkBuilder(), {
    params: {id: documentId},
    initialValue: [],
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
        onResize={undefined}
        onResizeCapture={undefined}
      >
        <Spinner muted onResize={undefined} onResizeCapture={undefined} />
        <Text muted size={1} onResize={undefined} onResizeCapture={undefined}>
          Loading hierarchy…
        </Text>
      </Flex>
    )
  }
  if (error) {
    return <div>error: {error}</div>
  }
  return <TreeStructure concepts={data} />
}

export default Hierarchy
