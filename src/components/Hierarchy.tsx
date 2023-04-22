/**
 * Concept Scheme Tree View
 */

import {Flex, Spinner, Text, Inline} from '@sanity/ui'
import {useEffect, useState} from 'react'
import {useClient} from 'sanity'
import {TopConceptTerms, ChildConceptTerms, DocumentVersionsCollection} from '../types'

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

const ChildConcepts = ({concepts}: {concepts: ChildConceptTerms[]}) => {
  return (
    <ul style={{listStyle: 'none'}}>
      {concepts.map((concept: any) => {
        return (
          <li key={concept.id} style={{fontWeight: 'normal', marginTop: '.75rem'}}>
            {concept.prefLabel}
            {concept.childConcepts?.length > 0 && (
              <ChildConcepts concepts={concept.childConcepts} />
            )}
          </li>
        )
      })}
    </ul>
  )
}

const TreeStructure = ({concepts}: {concepts: any}) => {
  return (
    <ul style={{listStyle: 'none', paddingLeft: '0', marginTop: '1rem'}}>
      {concepts.topConcepts &&
        concepts.topConcepts.map((concept: TopConceptTerms) => {
          return (
            <li
              key={concept?.id}
              style={{paddingTop: '.5rem', fontWeight: 'bold', marginTop: '.75rem'}}
            >
              <Inline space={2} onResize={undefined} onResizeCapture={undefined}>
                {concept?.prefLabel}
                <Text size={1} muted onResize={undefined} onResizeCapture={undefined}>
                  top concept
                </Text>
              </Inline>
              {concept?.childConcepts && concept.childConcepts.length > 0 && (
                <ChildConcepts concepts={concept.childConcepts} />
              )}
            </li>
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

// The Hierarchy component fetches and displays the complete tree.
export const Hierarchy = ({
  document,
  documentId,
}: {
  document: DocumentVersionsCollection
  documentId: string
}) => {
  const client = useClient({apiVersion: '2021-10-21'})

  const [concepts, setConcepts] = useState<any>([])
  const [isLoading, setIsLoading] = useState(true)
  const [noConcept, setNoConcept] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isIdAligned, setIsIdAligned] = useState(false) // do the document IDs match?

  const {
    displayed: {_id: dId, topConcepts: dTopConcepts, concepts: dConcepts},
  } = document

  const fetchConcepts = async () => {
    try {
      // wait 1 second to allow the document to be saved. The arbitrary delay is lamentable, but a recursive query to fetch the tree never finishes.
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const res = await client.fetch(trunkBuilder(), {id: dId})
      if (res.topConcepts === null && res.orphans.length < 1) {
        setNoConcept(true)
      } else {
        setNoConcept(false)
        setConcepts(res)
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('Error: ', error)
      setIsError(true)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    setNoConcept(false)

    // if documents don't match, return; still loading
    if (document.displayed._id.replace(/^drafts\./, '') !== documentId) {
      setIsIdAligned(false)
      return
      // If there is no title defined, the display document is not done loading
    } else if (
      document.displayed._id.replace(/^drafts\./, '') === documentId &&
      document.displayed.title === undefined
    ) {
      return
      // set to noConcepts if the documents match, but there are no concepts defined
    } else if (
      document.displayed._id.replace(/^drafts\./, '') === documentId &&
      document.displayed.concepts === undefined &&
      document.displayed.topConcepts === undefined
    ) {
      setIsIdAligned(true)
      setIsLoading(false)
      setNoConcept(true)
      return
    }
    setIsIdAligned(true)
    setIsLoading(true)
    // if documents are aligned, and there are concepts, fetch the hierarchy
    fetchConcepts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dId, dTopConcepts, dConcepts])

  if (isError == true) {
    return <p>Sorry, could not get concepts.</p>
    // unaligned IDs mean the display document is still loading. Show nothing.
  } else if (isIdAligned == false) {
    return (
      <Text muted size={1} onResize={undefined} onResizeCapture={undefined}>
        <p>...</p>
      </Text>
    )
  } else if (noConcept == true) {
    return (
      <Text muted size={1} onResize={undefined} onResizeCapture={undefined}>
        <p>This scheme does not yet have any concepts assigned to it.</p>
      </Text>
    )
  }
  return isLoading ? (
    // once we're actually getting data, show loading spinner while fetching
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
  ) : (
    <TreeStructure concepts={concepts} />
  )
}

export default Hierarchy
