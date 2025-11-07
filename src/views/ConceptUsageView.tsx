import {Flex, Spinner, Stack, Box, Card, Inline, Text, Button} from '@sanity/ui'
import {fromString as pathFromString} from '@sanity/util/paths'
import {useContext, useCallback} from 'react'
import {Preview, useSchema} from 'sanity'
import type {SanityDocument} from 'sanity'
import type {UserViewComponent} from 'sanity/structure'
import {usePaneRouter} from 'sanity/structure'
import {Feedback, useListeningQuery} from 'sanity-plugin-utils'

import {ReleaseContext} from '../context'

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
  const releaseContext: string = useContext(ReleaseContext) as string
  const {routerPanesState, groupIndex, handleEditReference} = usePaneRouter()
  const schema = useSchema()

  const rawId = (document.displayed as {_id?: string})?._id ?? ''
  const refId = rawId.replace(/^drafts\./, '')

  const handleClick = useCallback(
    (id: string, type: string) => {
      const childParams = routerPanesState[groupIndex + 1]?.[0].params || {}
      const {parentRefPath} = childParams

      handleEditReference({
        id,
        type,
        // Uncertain that this works as intended
        parentRefPath: parentRefPath ? pathFromString(parentRefPath) : [``],
        template: {id},
      })
    },
    [routerPanesState, groupIndex, handleEditReference]
  )

  // scheme structure left in place for future use
  const {data, loading, error} = useListeningQuery<SanityDocument[]>(
    `*[_id == $refId]{
      "schemes": [],
      // "schemes": *[_type == "skosConceptScheme" 
      //           && references($refId)][0...200]{_id,_type,title},
      "tagged": *[references($refId) 
                && !(_type in ["skosConcept","skosConceptScheme"])][0...200]{_id,_type,title}
  }[0]`,
    {
      params: {refId},
      options: {
        perspective: releaseContext === undefined ? 'drafts' : [releaseContext],
      },
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

  if (!data?.tagged?.length) {
    return (
      <Stack padding={4} space={5}>
        <Feedback>This concept is not currently in use</Feedback>
      </Stack>
    )
  }

  return (
    <Box padding={4} paddingTop={4}>
      <Stack space={2}>
        <Card borderBottom paddingTop={3} paddingBottom={3}>
          <Inline paddingTop={1}>
            <Text weight="semibold" muted size={1}>
              Resource count (all schemes): {data.tagged.length}
            </Text>
          </Inline>
        </Card>
        <Stack space={1}>
          {data?.tagged &&
            data.tagged.map((d: TagReference) => {
              const schemaType = schema.get(d._type)
              return (
                schemaType && (
                  <Button
                    key={d._id}
                    // eslint-disable-next-line react/jsx-no-bind
                    onClick={() => handleClick(d._id, d._type)}
                    padding={2}
                    mode="bleed"
                  >
                    <Preview value={d} schemaType={schemaType} layout="block" />
                  </Button>
                )
              )
            })}
        </Stack>
      </Stack>
    </Box>
  )
}
