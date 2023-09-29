import {Grid, Stack, Button, Dialog, Box} from '@sanity/ui'
import {useState, useEffect} from 'react'
import {useClient} from 'sanity'
// import {TreeStructure} from '../components/TreeStructure'
import {TreeView} from '../components/TreeView'

export function HierarchyInput(props: any) {
  // const {onChange}: {onChange: any} = props.inputProps

  // console.log(onChange)

  // need to ensure things don't crash with an empty document here
  const fillerDocument = {
    displayed: {
      baseIri: 'https://example.com/',
      concepts: [
        {
          related: [],
          _createdAt: '2023-08-16T13:39:16Z',
          _rev: 'L4M5BwH2sViysRDOPFUFJf',
          _type: 'skosConcept',
          conceptId: '8833c1',
          baseIri: 'https://example.com/',
          prefLabel: 'Birds',
          _id: '1a4435a2b87a42e3e81b98a4baa7d5ff',
          broader: [
            {
              _ref: 'a0955815c4770261d41bac8aa4d3e748',
              _type: 'reference',
              _key: '830e7c',
            },
          ],
          _updatedAt: '2023-08-16T13:39:22Z',
        },
        {
          _createdAt: '2023-08-16T13:39:45Z',
          _rev: 'L4M5BwH2sViysRDOPFUJDy',
          conceptId: '35e673',
          related: [],
          prefLabel: 'Butterflies',
          _type: 'skosConcept',
          _id: '98026195a69129c5c6a2e82d41145255',
          broader: [
            {
              _ref: 'a0955815c4770261d41bac8aa4d3e748',
              _type: 'reference',
              _key: 'b429b5',
            },
          ],
          _updatedAt: '2023-08-16T13:39:51Z',
          baseIri: 'https://example.com/',
        },
        {
          _createdAt: '2023-08-16T13:39:37Z',
          prefLabel: 'Bees',
          _type: 'skosConcept',
          broader: [
            {
              _ref: 'a0955815c4770261d41bac8aa4d3e748',
              _type: 'reference',
              _key: '6ee448',
            },
          ],
          _updatedAt: '2023-08-16T13:39:42Z',
          baseIri: 'https://example.com/',
          related: [],
          _rev: 'L4M5BwH2sViysRDOPFUI5u',
          conceptId: '7f424c',
          _id: 'bfd22e25ee28d94cf76e87acd9201312',
        },
        {
          _id: 'ce33d0fc9213ca036d7cecb958a8b476',
          _createdAt: '2023-08-16T13:39:25Z',
          prefLabel: 'Hummingbirds',
          _type: 'skosConcept',
          conceptId: '1e668d',
          broader: [
            {
              _ref: '1a4435a2b87a42e3e81b98a4baa7d5ff',
              _type: 'reference',
              _key: '096095',
            },
          ],
          _updatedAt: '2023-08-16T13:39:32Z',
          baseIri: 'https://example.com/',
          related: [],
          _rev: 'bzZ5SGBSb1WLZp9hRgt70C',
        },
      ],
      _type: 'skosConceptScheme',
      _rev: 'bzZ5SGBSb1WLZp9hRjb2ls',
      schemeId: 'cf76c1',
      _updatedAt: '2023-08-16T19:23:42Z',
      controls: false,
      _id: 'bf23320c-decf-41b4-b0ba-a8bdd7ce3d2b',
      title: 'Plant Finder Facets',
      topConcepts: [
        {
          _createdAt: '2023-08-16T13:38:57Z',
          _rev: 'L4M5BwH2sViysRDOPFUEBb',
          conceptId: '1e5e6c',
          _id: 'a0955815c4770261d41bac8aa4d3e748',
          _updatedAt: '2023-08-16T13:39:05Z',
          baseIri: 'https://example.com/',
          related: [],
          prefLabel: 'Habitat',
          _type: 'skosConcept',
          broader: [],
        },
      ],
      _createdAt: '2023-08-16T13:33:34Z',
      description: 'Used identify distinct attributes of plants for the Plant Finder tool\n',
    },
  }

  const [open, setOpen] = useState(false)
  // eslint-disable-next-line no-unused-vars
  const [document, setDocument] = useState(fillerDocument)
  const client = useClient({apiVersion: '2021-10-21'})

  //   console.log('props: ', props)

  const filter = props.schemaType.options.filter // returns the filter function
  const filterExec = filter()
  const branchId = filterExec.params.branchId
  const schemeId = filterExec.params.schemeId
  //   console.log('branchId: ', branchId)
  //   console.log('schemeId: ', schemeId)

  // returns =>
  //  filter:  "!(_id in path("drafts.**")) && _id in *[_type=="skosConceptScheme" && schemeId == $schemeId].concepts[]._ref
  //                && $branchId in broader[]->conceptId
  //                || $branchId in broader[]->broader[]->conceptId
  //                || $branchId in broader[]->broader[]->broader[]->conceptId
  //                || $branchId in broader[]->broader[]->broader[]->broader[]->conceptId
  //                || $branchId in broader[]->broader[]->broader[]->broader[]->broader[]->conceptId"
  // params: {
  //     branchId: "1e5e6c"
  //     schemeId: "cf76c1"
  // }

  useEffect(() => {
    client
      .fetch(`{"displayed": *[schemeId == "${schemeId}"][0]}`)
      .then((res) => {
        // setDocument(res)
        return res
      })
      // eslint-disable-next-line no-console
      .then((res) => console.log('fetch result: ', res))
  }, [])

  function BrowseHierarchy() {
    setOpen(true)
  }

  // const concepts = {
  //   _updatedAt: '2023-08-16T19:23:42Z',
  //   topConcepts: [
  //     {
  //       id: '36832ba2b1eca768553fd0f2c6befd3e',
  //       level: 0,
  //       prefLabel: 'Foliage Color',
  //       definition: null,
  //       example: null,
  //       scopeNote: null,
  //       childConcepts: [
  //         {
  //           id: 'b184088ffe172dbb7650e378fda269d2',
  //           level: 1,
  //           prefLabel: 'Black',
  //           definition: null,
  //           example: null,
  //           scopeNote: null,
  //           childConcepts: [],
  //         },
  //         {
  //           example: null,
  //           scopeNote: null,
  //           childConcepts: [],
  //           id: '7de989b3a2347cf6fe97bb62e8f0f9d7',
  //           level: 1,
  //           prefLabel: 'Blue',
  //           definition: null,
  //         },
  //         {
  //           example: null,
  //           scopeNote: null,
  //           childConcepts: [],
  //           id: 'e47f59f33f9ef4f4c45eb22330e6080d',
  //           level: 1,
  //           prefLabel: 'Bronze',
  //           definition: null,
  //         },
  //         {
  //           level: 1,
  //           prefLabel: 'Green',
  //           definition: null,
  //           example: null,
  //           scopeNote: null,
  //           childConcepts: [],
  //           id: '18f598d89c54eec56ce5e447d05ab6b9',
  //         },
  //         {
  //           id: '2432d591f792f9ef506858d67f6d9790',
  //           level: 1,
  //           prefLabel: 'Purple',
  //           definition: null,
  //           example: null,
  //           scopeNote: null,
  //           childConcepts: [],
  //         },
  //         {
  //           scopeNote: null,
  //           childConcepts: [],
  //           id: '70c88ff6550b0bfa58aad6f023e2cab6',
  //           level: 1,
  //           prefLabel: 'Red',
  //           definition: null,
  //           example: null,
  //         },
  //         {
  //           example: null,
  //           scopeNote: null,
  //           childConcepts: [],
  //           id: 'b0f9032805575200aa2a3d8ba61fb8f4',
  //           level: 1,
  //           prefLabel: 'Silver',
  //           definition: null,
  //         },
  //       ],
  //     },
  //     {
  //       level: 0,
  //       prefLabel: 'Foliage Type',
  //       definition: null,
  //       example: null,
  //       scopeNote: null,
  //       childConcepts: [
  //         {
  //           prefLabel: 'Deciduous',
  //           definition: null,
  //           example: null,
  //           scopeNote: null,
  //           childConcepts: [],
  //           id: '2e1000bc7f7a5af2dafc69eb02ca1ff5',
  //           level: 1,
  //         },
  //         {
  //           definition: null,
  //           example: null,
  //           scopeNote: null,
  //           childConcepts: [],
  //           id: '45be6f64fb92d563fbc8db60b80f9b31',
  //           level: 1,
  //           prefLabel: 'Evergreen',
  //         },
  //         {
  //           level: 1,
  //           prefLabel: 'Semi-Evergreen',
  //           definition: null,
  //           example: null,
  //           scopeNote: null,
  //           childConcepts: [],
  //           id: '043a7e50488886b266d3669c6bb0bb2f',
  //         },
  //       ],
  //       id: '23366a6ad173eb7c68a2391d69159b07',
  //     },
  //     {
  //       level: 0,
  //       prefLabel: 'Habitat',
  //       definition: null,
  //       example: null,
  //       scopeNote: null,
  //       childConcepts: [
  //         {
  //           id: 'bfd22e25ee28d94cf76e87acd9201312',
  //           level: 1,
  //           prefLabel: 'Bees',
  //           definition: null,
  //           example: null,
  //           scopeNote: null,
  //           childConcepts: [],
  //         },
  //         {
  //           level: 1,
  //           prefLabel: 'Birds',
  //           definition: null,
  //           example: null,
  //           scopeNote: null,
  //           childConcepts: [
  //             {
  //               id: 'ce33d0fc9213ca036d7cecb958a8b476',
  //               level: 2,
  //               prefLabel: 'Hummingbirds',
  //               definition: null,
  //               example: null,
  //               scopeNote: null,
  //               childConcepts: [],
  //             },
  //           ],
  //           id: '1a4435a2b87a42e3e81b98a4baa7d5ff',
  //         },
  //         {
  //           id: '98026195a69129c5c6a2e82d41145255',
  //           level: 1,
  //           prefLabel: 'Butterflies',
  //           definition: null,
  //           example: null,
  //           scopeNote: null,
  //           childConcepts: [],
  //         },
  //       ],
  //       id: 'a0955815c4770261d41bac8aa4d3e748',
  //     },
  //     {
  //       example: null,
  //       scopeNote: null,
  //       childConcepts: [
  //         {
  //           definition: null,
  //           example: null,
  //           scopeNote: null,
  //           childConcepts: [],
  //           id: 'f2dac4274c77ab817af75f5beb06036e',
  //           level: 1,
  //           prefLabel: 'zone 6 (-10°F to 0°F)',
  //         },
  //         {
  //           level: 1,
  //           prefLabel: 'zone 7 (0°F to 10°F)',
  //           definition: 'USDA Zones 7 and 8 generally cover the maritime Pacific Northwest.\n',
  //           example: null,
  //           scopeNote: null,
  //           childConcepts: [],
  //           id: '7fc655f010742f24b3c075069fb1ead4',
  //         },
  //         {
  //           id: '93f3f473012f3bad2600d91fca7c3844',
  //           level: 1,
  //           prefLabel: 'zone 8 (10°F to 20°F)',
  //           definition: 'USDA Zones 7 and 8 generally cover the maritime Pacific Northwest.\n',
  //           example: null,
  //           scopeNote: null,
  //           childConcepts: [],
  //         },
  //         {
  //           id: '6663c7a56060c2ea2ace1f1f89257b63',
  //           level: 1,
  //           prefLabel: 'zone 9 (20°F to 30°F)',
  //           definition: null,
  //           example: null,
  //           scopeNote: null,
  //           childConcepts: [],
  //         },
  //       ],
  //       id: '0bdb7beddb6f6eb69f29f476298a1a01',
  //       level: 0,
  //       prefLabel: 'Hardiness',
  //       definition: 'USDA climate zones ',
  //     },
  //   ],
  //   orphans: [],
  // }

  // so: I need to get the document from the schemeId, filtered to the branch ID, if present
  // _not_ just the filtered terms
  // also need to figure out which document values are actually needed
  // and rewrite trunkBuilder to filter by branchId ✅

  const handleAction = (label: any) => {
    // eslint-disable-next-line no-alert
    alert(`Action here, y'all — ${label}`)
    // console.log(e)
  }

  return (
    <Stack space={3}>
      {props.renderDefault(props)}

      <Grid columns={1} gap={3}>
        <Button text="Browse Taxonomy Tree" mode="ghost" onClick={BrowseHierarchy} />
      </Grid>
      {open && (
        <Dialog
          header="Example"
          id="dialog-example"
          onClose={() => setOpen(false)}
          zOffset={900}
          width={1}
        >
          <Box padding={10}>
            {/* inputComponent will be used to select features of TreeView to include or not in the input component */}
            <TreeView
              document={document}
              branchId={branchId}
              inputComponent
              selectConcept={handleAction}
            />
          </Box>
        </Dialog>
      )}
    </Stack>
  )
}
