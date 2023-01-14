/**
 * SKOS Concept Preferred Label input component
 * @todo Concept IRI display needs to be rebuild for V3. cf: https://www.sanity.io/docs/migration-cheat-sheet#3f574a47972e for possible info on plugin:config
 * @todo `useFormValue` lags one update behind and has been flagged as a bug: https://github.com/sanity-io/sanity/issues/3606. Monitor for updates/fixes. 
 */

import {Stack, Text} from '@sanity/ui'
import {StringInputProps, useFormValue, set, unset} from 'sanity'

export function UriField(props: StringInputProps) {

  const iriBase: any = useFormValue([`conceptIriBase`])
  const iriValue = iriBase?.iriValue || '[base URI not defined] '

  const type: any = useFormValue([`_type`])
    
  return (
    <Stack space={2}>
      {props.renderDefault(props)}
      <Text muted size={1} onResize={undefined} onResizeCapture={undefined}>
        <strong>{type == "skosConcept" ? "Concept " : "Scheme "} IRI: </strong>
        {iriValue}
        {props.value?.replaceAll(' ', '')}
      </Text>
    </Stack>
  )
}


