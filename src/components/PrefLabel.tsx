/**
 * SKOS Concept Preferred Label input component
 */

import {Stack, Text} from '@sanity/ui'
import {useFormValue} from 'sanity'
import {PrefLabelValue} from '../types'

export function PrefLabel(props: PrefLabelValue) {
  const baseIri = useFormValue(['baseIri'])
  return (
    <Stack space={2}>
      {props.renderDefault(props)}
      <Text muted size={1} onResize={undefined} onResizeCapture={undefined}>
        <>
          <strong>Concept IRI: </strong>
          {baseIri ? baseIri : '[base URI not defined] '}
          {props.value?.replaceAll(' ', '')}
        </>
      </Text>
    </Stack>
  )
}
