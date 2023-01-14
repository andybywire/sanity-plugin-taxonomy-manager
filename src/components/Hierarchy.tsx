/**
 * @todo Consider adding collapse/expand functionality to tree view
 */

import {Flex, Spinner, Text, Inline} from '@sanity/ui'
import {useEffect, useState} from 'react'
import {useClient} from 'sanity'
import s from './Hierarchy.module.css'

// guidance on orphans to link to/integrate: https://www.hedden-information.com/orphan-terms-in-a-taxonomy/

// Run tree to a depth of 6 levels. Return 5. If there is a 6th, do no return it; return a message. 
// Perhaps this is most effectively messaged in the UI component. if a 6th, print message. 

const trunkBuilder = (): string => {
  return `coalesce(*[_id == 'drafts.' + $id][0], *[_id == $id][0]) {
    "topConcepts":topConcepts[]->|order(prefLabel){
      "id": _id,
      "level": 0,
      prefLabel,
      ${branchBuilder()}
    },
    "orphans": *[
        // filter to concepts in this scheme only:
      _id in coalesce(*[_id == 'drafts.' + $id][0], *[_id == $id][0]).concepts[]._ref // filter to concepts in this scheme only
        // filter out concepts that reference a topConcept in this scheme as a broader term:
      && count((broader[]._ref) [@ in coalesce(*[_id == 'drafts.' + $id][0], *[_id == $id][0]).topConcepts[]._ref]) < 1
        // filter out concepts that reference other concepts in this scheme as a broader term:
      && count((broader[]._ref) [@ in coalesce(*[_id == 'drafts.' + $id][0], *[_id == $id][0]).concepts[]._ref]) < 1
    ]|order(prefLabel){
      "id": _id,
      "level": 0,
      prefLabel,
      ${branchBuilder()}
    }
  }`
}

const branchBuilder = (level = 1): string | void => {
  if (level > 6 ) {
    return ''
  } else {
    return `"childConcepts": *[_id in coalesce(*[_id == 'drafts.' + $id][0], *[_id == $id][0]).concepts[]._ref && ^._id in broader[]._ref ]|order(prefLabel){
      "id": _id,
      "level": ${level},
      prefLabel,
      ${branchBuilder(level +1)}
    }`
  }
}

// setTimeout function
const sleep = (ms: number) => {
  console.log('waiting')
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const ChildConcepts = ({concepts}: {concepts: any}) => {
  return (
    <ul className={s.skosTreeView}>
      {concepts.map((concept: any) => {
        return (
          <li key={concept.id}
          className={s.childConcept}>
            {concept.prefLabel}
            {concept.childConcepts?.length > 0 && <ChildConcepts concepts={concept.childConcepts} />}
          </li>
        )
      })}
    </ul>
  )
}

const Hierarchy = ({document, documentId}: {document: any, documentId: any}) => {

  const client = useClient({apiVersion: '2021-10-21'})

  const [concepts, setConcepts] = useState<any>([])
  const [isLoading, setIsLoading] = useState(true)
  const [noConcept, setNoConcept] = useState(false)
  const [isError, setIsError] = useState(false)
  const [currentDoc, setCurrentDoc] = useState(documentId)

  useEffect(() => {
    if (document.displayed._id === undefined ) return

    const fetchConcepts = async () => {
      
      console.log(concepts)
      
      setCurrentDoc(documentId)
      
      // reset state variables for new fetch
      setIsLoading(true)
      setNoConcept(false)
      setIsError(false)

      // tree view has been loaded at least once, first wait to allow the content lake to update
      // documentID and document.displayed also don't align on first render
      concepts.length != 0 && currentDoc == documentId && await sleep(1000)
      
      await client.fetch(  
        trunkBuilder(),
        {id: documentId}
      )
      .then(res => {
        if (res.topConcepts == null && res.orphans.length < 1) {
          setIsLoading(false)
          setNoConcept(true)
        } else {
          setIsLoading(false)
          setConcepts(res)
        }
      })
      .catch(error => {
        console.log('Error: ', error)
        setIsLoading(false)
        setIsError(true)
      })
    }
    fetchConcepts()
  }, [documentId, document.displayed.concepts, document.displayed.topConcepts])

  if (isError == true) {
    return <p>Sorry, could not get concepts.</p>
  } else if (noConcept == true) {
    return <p>This scheme does not yet have any concepts assigned to it.</p>
  } else {
    return isLoading ? (
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
    ) : (
      <ul className={`${s.skosTreeView} ${s.level_0}`}>
        {concepts.topConcepts.map((concept: any) => {
          if (concept?.id)
          return (
            <li key={concept.id}
            className={s.topConcept}>
              <Inline space={2}>
                {concept?.prefLabel}     
                <Text size={1} muted={true}>
                  top concept
                </Text>
              </Inline>
              {concept?.childConcepts?.length > 0 && <ChildConcepts concepts={concept.childConcepts} />}
            </li>
          )
        })}
        {concepts.orphans.map((concept: any) => {
          return (
            <li key={concept.id}
            className={s.orphan}>
              <Inline space={2}>
                {concept?.prefLabel}     
                <Text size={1} muted={true}>
                  orphan
                </Text>
              </Inline>
              {concept.childConcepts?.length > 0 && <ChildConcepts concepts={concept.childConcepts} />}
            </li>
          )
        })}
      </ul>
    ) 
  }
}

export default Hierarchy