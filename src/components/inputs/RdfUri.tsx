import {useFormValue} from 'sanity'
import {Stack, Text} from '@sanity/ui'
import {StringInputProps} from 'sanity'

/**
 * #### SKOS Concept Base URI input component
 * Used for Concept and Concept Scheme URI preview
 */
export function RdfUri(props: StringInputProps) {
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
