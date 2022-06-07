/**
 * Taxonomy Tree View input component for SKOS Concept Schemes
 * This component creates a hierarchical, linked display of concepts associated with the associated Concept Scheme
 */

  import React, { useState, useEffect }  from 'react'
  import { Box, Stack, Text } from '@sanity/ui'
  import sanityClient from 'part:@sanity/base/client'
  import * as s from "./treeView.module.css"
 
  const client = sanityClient.withConfig({apiVersion: '2021-03-25'})

  // This saves 50 lines of code:
  const RecursiveConcept = (props) => {
    return (
      <ul> 
        {props.concepts.map((concept) => {
          return (
            <li key={concept.id} className={`${concept.topConcept ? s.topConcept : s.orphan}`}>
              {concept.prefLabel}
              {concept.narrower.length > 0 &&  <RecursiveConcept concepts={concept.narrower} />}  
            </li>
          )
        })}
      </ul>
    )
  }

  // The polyhierarchy flag is wonky — needs the conceptScheme variable I define below ... but I also don't like defining the component in there; seems to brittle. 
  // ${concept.broaderSchemas.filter(id => id === conceptScheme).length > 1 && s.polyHier}


  const TreeView = React.forwardRef((props, ref) => {  
  const [concepts, setConcepts] = useState([]);
  const conceptScheme = props.parent._id;

  useEffect(() => {
    const fetchConcepts = async () => {
      const params = {conceptScheme: conceptScheme};
      const query = 
        `*[_type=="skosConcept" && references($conceptScheme) && (count(broader[]) < 1 || broader == null) && !(_id in path("drafts.**"))]|order(prefLabel) {
          "level": 0,
          "id": _id,
          prefLabel,
          topConcept,
          "narrower": *[_type == "skosConcept" && references($conceptScheme) && references(^._id) && !(_id in path("drafts.**"))]|order(prefLabel) {
            "level": 1,
            "id": _id,
            prefLabel,
            "broaderSchemas": broader[]->scheme->._id,
            "narrower": *[_type == "skosConcept" && references($conceptScheme) && references(^._id) && !(_id in path("drafts.**"))]|order(prefLabel) {
              "level": 2,
              "id": _id,
              prefLabel,
              "broaderSchemas": broader[]->scheme->._id,
              "narrower": *[_type == "skosConcept" && references($conceptScheme) && references(^._id) && !(_id in path("drafts.**"))]|order(prefLabel) {
                "level":3,  
                "id": _id,
                prefLabel,
                "broaderSchemas": broader[]->scheme->._id,
                "narrower": *[_type == "skosConcept" && references($conceptScheme) && references(^._id) && !(_id in path("drafts.**"))]|order(prefLabel) {
                  "level": 4,
                  "id": _id,
                  prefLabel,
                  "broaderSchemas": broader[]->scheme->._id,
                  "narrower": *[_type == "skosConcept" && references($conceptScheme) && references(^._id) && !(_id in path("drafts.**"))]|order(prefLabel) {
                    "level": 5,
                    "id": _id,
                    prefLabel
                  }
                }
              }
            }
          }
        }`
      const response = await client.fetch(query, params);
      // const conceptsList = await response.map((concept, index) => {
      //   return (

      //     <ul className={s.level_0}>
      //       <li key={concept.id} className={concept.topConcept ? s.topConcept : s.orphan}>{concept.prefLabel}
      //         {concept.narrower && concept.narrower.map((concept) => {
      //           return (
      //             <ul> {/* level 1 */}

      //               <RecursiveConcept {...concept} />

      //               {/* <li key={concept.id} className={concept.broaderSchemas.filter(id => id === conceptScheme).length > 1 && s.polyHier}>{concept.prefLabel} */}
      //                 {/* {concept.narrower && concept.narrower.map((concept) => {
      //                   return (
      //                     <ul> 
      //                       <li key={concept.id} className={concept.broaderSchemas.filter(id => id === conceptScheme).length > 1 && s.polyHier}>{concept.prefLabel}
      //                         {concept.narrower && concept.narrower.map((concept) => {
      //                           return (
      //                             <ul> 
      //                               <li key={concept.id} className={concept.broaderSchemas.filter(id => id === conceptScheme).length > 1 && s.polyHier}>{concept.prefLabel}
      //                                 {concept.narrower && concept.narrower.map((concept) => {
      //                                   return (
      //                                     <ul> 
      //                                       <li key={concept.id} className={concept.broaderSchemas.filter(id => id === conceptScheme).length > 1 && s.polyHier}>{concept.prefLabel}
      //                                         {concept.narrower && concept.narrower.map((concept) => {
      //                                           return (
      //                                             <ul> 
      //                                               <li key={concept.id} className={concept.broaderSchemas.filter(id => id === conceptScheme).length > 1 && s.polyHier}>{concept.prefLabel}</li>
      //                                             </ul>
      //                                           )
      //                                         })}
      //                                       </li>
      //                                     </ul>
      //                                   )
      //                                 })}
      //                               </li>
      //                             </ul>
      //                           )
      //                         })}
      //                       </li>
      //                     </ul>
      //                   )
      //                 })} */}
      //               {/* </li> */}
      //             </ul>
      //           )
      //         })}
      //       </li>
      //     </ul>
      //   )
      // });     
      setConcepts(response)
    }
    fetchConcepts();
  }, []);

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
          <RecursiveConcept concepts={concepts} />
        </Text>
      </Stack>
    </Box>
  )
 })

 export default TreeView

 /**
  * Need to look into: 
  *  - more async functions — I seem to be losing what little I understood of this
  *  - forwardRef — why is this being used here, do I need it, and how can I leverage it?
  *  - maybe a way to get the links in?
  *  - notes on Sanity client: https://www.sanity.io/help/studio-client-specify-api-version
  *  - fetching data: https://www.robinwieruch.de/react-hooks-fetch-data/
  *  - list components: https://reactjs.org/docs/lists-and-keys.html#basic-list-component
  *  - toggles: https://www.freecodecamp.org/news/build-accordion-menu-in-react-without-external-libraries/
  */

  // Link opens two panes: 
  // http://localhost:3333/desk/method;02f3a817-fa4a-497d-aa4a-467099ee28f9;d2fb694b-1d96-4120-9d0d-8bc0b8785242%2Ctype%3Ddiscipline

  // http://localhost:3333/desk/skosConceptScheme;c569fd55-ce72-488a-8b72-c0f1db3d259c;25af2dbf-52f8-445a-93e6-017340794adb%2Ctype%3DskosConcept

  // Link to discipline:
  // http://localhost:3333/desk/discipline;d2fb694b-1d96-4120-9d0d-8bc0b8785242

  // Link to two panes opened from studio reference:  
  // http://localhost:3333/desk/method;02f3a817-fa4a-497d-aa4a-467099ee28f9;d2fb694b-1d96-4120-9d0d-8bc0b8785242%2Ctype%3Ddiscipline%2CparentRefPath%3DdisciplinesReference%5B_key%3D%3D%227d2d8215cf2d%22%5D

  // http://localhost:3333/desk/method;02f3a817-fa4a-497d-aa4a-467099ee28f9;
  // d2fb694b-1d96-4120-9d0d-8bc0b8785242
  // %2C ,
  // type
  // %3D =
  // discipline
  // %2C ,
  // parentRefPath
  // %3D =
  // disciplinesReference
  // %5B [
  // _key
  // %3D =
  // %3D =
  // %22 "
  // 7d2d8215cf2d
  // %22 "
  // %5D ]

  // http://localhost:3333/desk/method;02f3a817-fa4a-497d-aa4a-467099ee28f9;
  // d2fb694b-1d96-4120-9d0d-8bc0b8785242,type=discipline,parentRefPath=disciplinesReference[_key=="7d2d8215cf2d"]

  // New Pane — though doesn't work by just appending the string to the URL
  // %7C%2C
  // |,

