/**
 * SKOS Concept Base URI input component
 * Used for Concept and Concept Scheme URI preview
 * @todo Pull in not the Base URI but the Concept URI
 * @todo Add logic to change label based on whether it's a Concept or Concept Scheme
 */

import {Stack, Text} from '@sanity/ui'
import {useFormValue} from 'sanity'
// import {PrefLabelValue} from '../types'

export function RdfUri(props: any) {
  const conceptId = useFormValue(['conceptId'])
  const schemeId = useFormValue(['schemeId'])
  return (
    <Stack space={2}>
      {props.renderDefault(props)}
      <Text muted size={1} onResize={undefined} onResizeCapture={undefined}>
        <>
          <strong>RDF URI: </strong>
          {props.value ? props.value : '[base URI not defined] '}
          {conceptId || schemeId || ' [identifier not assigned]'}
        </>
      </Text>
    </Stack>
  )
}
