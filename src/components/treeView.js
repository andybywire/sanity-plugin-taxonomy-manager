/**
 * Taxonomy Tree View input component for SKOS Concept Schemes
 * This component creates a hierarchical, linked display of concepts associated with the associated Concept Scheme
 */

 import React, { useState, useEffect }  from 'react'
//  import { route, IntentLink, StateLink, RouterProvider, withRouter, withRouterHOC } from "@sanity/base/router";
 import {Stack, Text, Label} from '@sanity/ui'
 import sanityClient from 'part:@sanity/base/client'
//  import { createBrowserHistory } from 'history';
 
 
 const client = sanityClient.withConfig({apiVersion: '2021-03-25'})

//  const router = route('/', [
//   route('/desk/:id'),
//  ])

//  const history = createBrowserHistory()

//  function handleNavigate(nextUrl, {replace} = {}) {
//   if (replace) {
//      history.replace(nextUrl)
//    } else {
//      history.replace(nextUrl)
//    }
//  }

 const TreeView = React.forwardRef((props, ref) => {
  
  const [concepts, setConcepts] = useState(0);
  
  const conceptScheme = props.parent._id;
  console.log(props.parent._id);
  // const conceptScheme = 'c569fd55-ce72-488a-8b72-c0f1db3d259c'; // Outcomes
  // const conceptScheme = '5eaeebb7-2aaf-4b34-8301-ab532f9d5e51'; // Fruit & Veg


  

  useEffect(() => {
    const fetchConcepts = async () => {
      const params = {conceptScheme: conceptScheme};
      const query = 
        `*[_type=="skosConcept" && references($conceptScheme) && (count(broader[]) < 1 || broader == null) && !(_id in path("drafts.**"))]|order(prefLabel) {
          "level": 0,
          "id": _id,
          prefLabel,
          topConcept,
          "narrower": *[_type == "skosConcept" && references(^._id) && !(_id in path("drafts.**"))]|order(prefLabel) {
            "level": 1,
            "id": _id,
            prefLabel,
            "narrower": *[_type == "skosConcept" && references(^._id) && !(_id in path("drafts.**"))]|order(prefLabel) {
              "level": 2,
              "id": _id,
              prefLabel,
              "narrower": *[_type == "skosConcept" && references(^._id) && !(_id in path("drafts.**"))]|order(prefLabel) {
                "level":3,  
                "id": _id,
                prefLabel,
                "narrower": *[_type == "skosConcept" && references(^._id) && !(_id in path("drafts.**"))]|order(prefLabel) {
                  "level": 4,
                  "id": _id,
                  prefLabel,
                  "narrower": *[_type == "skosConcept" && references(^._id) && !(_id in path("drafts.**"))]|order(prefLabel) {
                    "level": 5,
                    "id": _id,
                    prefLabel
                  }
                }
              }
            }
          }
        }`
      // `*[_type == 'skosConcept' && !(_id in path("drafts.**"))] | order(prefLabel asc) {
      //   "id":_id,
      //   prefLabel,
      //   topConcept,
      //   broader[]->{prefLabel}
      // }`
      const response = await client.fetch(query, params);
      const conceptsList = await response.map((concept) => {
        return (
          <ul> {/* level 0 */}
            <li key={concept.id}>{concept.prefLabel}
              {concept.narrower && concept.narrower.map((concept) => {
                return (
                  <ul> {/* level 1 */}
                    <li key={concept.id}>{concept.prefLabel}
                      {concept.narrower && concept.narrower.map((concept) => {
                        return (
                          <ul> {/* level 2 */}
                            <li key={concept.id}>{concept.prefLabel}
                              {concept.narrower && concept.narrower.map((concept) => {
                                return (
                                  <ul> {/* level 3 */}
                                    <li key={concept.id}>{concept.prefLabel}
                                      {concept.narrower && concept.narrower.map((concept) => {
                                        return (
                                          <ul> {/* level 4 */}
                                            <li key={concept.id}>{concept.prefLabel}
                                              {concept.narrower && concept.narrower.map((concept) => {
                                                return (
                                                  <ul> {/* level 5 */}
                                                    <li key={concept.id}>{concept.prefLabel}</li>
                                                  </ul>
                                                )
                                              })}
                                            </li>
                                          </ul>
                                        )
                                      })}
                                    </li>
                                  </ul>
                                )
                              })}
                            </li>
                          </ul>
                        )
                      })}
                    </li>
                  </ul>
                )
              })}
            </li>
          </ul>
        )
      });     
      setConcepts(conceptsList)
      // setConcepts(JSON.stringify(response))
    }
    fetchConcepts();
  }, []);
  
  // const handleClick = useCallback(() => setClicked(true), []);
  

  return (
    <Stack space={1}>
    <Label size={1} semibold>
      Here's the Tree View component.
    </Label>
    <Text size={1}>
      <p>{JSON.stringify(props.parent.title)}</p>
      <p>Concepts:</p>
      {concepts}
      <p>{JSON.stringify(props.parent._id)}</p>

      
      {/* <RouterProvider
        router={router}
        onNavigate={handleNavigate}
        // state={router.decode(location.pathname)}
        > */}
        {/* <StateLink 
          data-as="a"
          data-ui="PaneItem"
          // state={{id: '/desk/skosConceptScheme;c569fd55-ce72-488a-8b72-c0f1db3d259c;25af2dbf-52f8-445a-93e6-017340794adb%2Ctype%3DskosConcept'}}
          state={{id: 'skosConcept;25af2dbf-52f8-445a-93e6-017340794adb'}}
          >
          Definition
        </StateLink> */}


        {/* <Text 
          as={StateLink}
          state={{id: '25af2dbf-52f8-445a-93e6-017340794adb'}}
          data-as="a"
          data-ui="PaneItem"          
          
          // data-ui="PaneItem"
          // to=""
          // state={{id: '25af2dbf-52f8-445a-93e6-017340794adb'}}
          >
          Definition
        </Text> */}
    {/* </RouterProvider> */}
      
    </Text>
    </Stack>
  )
 })

 export default TreeView
//  export default withRouterHOC(TreeView)


{/* <IntentLink
intent="edit"
params={{ id: '25af2dbf-52f8-445a-93e6-017340794adb', type: 'skosConcept' }}
>
Open Definition
</IntentLink> */}


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

