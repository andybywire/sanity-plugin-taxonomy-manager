/**
 * SKOS Concept Preferred Label input component
 * @todo Concept IRI display needs to be rebuild for V3
 */

import {Stack, Text} from '@sanity/ui'

export function PrefLabel(props) {
  return (
    <Stack space={2}>
      {props.renderDefault(props)}
      <Text muted size={1} onResize={undefined} onResizeCapture={undefined}>
        {/* <strong>Concept IRI: </strong>
        {props.parent?.conceptIriBase ? props.parent.conceptIriBase.iriValue : '[base URI not defined] '}
        {props.value?.replaceAll(' ', '')} */}
      </Text>
    </Stack>
  )
}