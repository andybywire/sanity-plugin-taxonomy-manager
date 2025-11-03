import {Flex, Spinner, Stack, Box, Text} from '@sanity/ui'
import type {SanityDocument} from 'sanity'
import type {UserViewComponent} from 'sanity/structure'
import {Feedback, useListeningQuery} from 'sanity-plugin-utils'

interface TagReference {
  _id: string
  _type: string
  title: string
}

export const ConceptUsageView: UserViewComponent<Record<string, never>> = ({
  document,
}: {
  document: {displayed: {_id?: string}}
}) => {
  const rawId = (document.displayed as {_id?: string})?._id ?? ''
  const refId = rawId.replace(/^drafts\./, '')

  // Investigate perspective option—-see Hierarchy.tsx
  const {data, loading, error} = useListeningQuery<SanityDocument[]>(
    `*[_id == $refId]{
      "schemes": *[_type == "skosConceptScheme" 
                && references($refId)][0...200]{_id,_type,title},
      "tagged": *[references($refId) 
                && !(_type in ["skosConcept","skosConceptScheme"])][0...200]{_id,_type,title}
  }[0]`,
    {
      params: {refId},
    }
  ) as {
    data: {schemes: TagReference[]; tagged: TagReference[]}
    loading: boolean
    error: Error | null
  }
  // eslint-disable-next-line no-console
  console.log(data)

  if (loading) {
    return (
      <Box padding={5}>
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
            Loading usage…
          </Text>
        </Flex>
      </Box>
    )
  }

  if (error) {
    return (
      <Stack padding={4} space={5}>
        <Feedback tone={'caution'}>There was en error fetching usage data</Feedback>
      </Stack>
    )
  }

  if (!data?.schemes?.length && !data?.tagged?.length) {
    return (
      <Stack padding={4} space={5}>
        <Feedback>This concept is not currently in use</Feedback>
      </Stack>
    )
  }

  return (
    <div style={{display: 'grid', gap: 16, padding: 16}}>
      <section>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </section>
      <section>{JSON.stringify(loading)}</section>
      <section>{JSON.stringify(error)}</section>
      <section>
        <h3>Concept Schemes</h3>
        <ul>
          {data?.schemes &&
            data.schemes.map((d: TagReference) => (
              <li key={d._id}>
                {d.title || d._id} <code>{d._type}</code>
              </li>
            ))}
        </ul>
      </section>
      <section>
        <h3>Assigned To</h3>
        <ul>
          {data?.tagged &&
            data.tagged.map((d: TagReference) => (
              <li key={d._id}>
                {d.title || d._id} <code>{d._type}</code>
              </li>
            ))}
        </ul>
      </section>
    </div>
  )
}
