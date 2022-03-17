/**
 * PrefLabel input component for SKOS Concept
 * This component creates a Concept IRI preview to help taxonomy managers avoid errors in minting URIs.
 */
import React from 'react'
import {FormField} from '@sanity/base/components'
import {TextInput, Stack, Text} from '@sanity/ui'
import PatchEvent, {set, unset} from '@sanity/form-builder/PatchEvent'
import {useId} from '@reach/auto-id' // hook to generate unique IDs

const PrefLabel = React.forwardRef((props, ref) => {
  const {
    type, // Schema information
    value, // Current field value
    readOnly, // Boolean if field is not editable
    placeholder, // Placeholder text from the schema
    markers, // Markers including validation rules
    presence, // Presence information for collaborative avatars
    compareValue, // Value to check for "edited" functionality
    onFocus, // Method to handle focus state
    onBlur, // Method to handle blur state
    onChange, // Method to handle patch events
    parent,
  } = props

  // Creates a unique ID for input
  const inputId = useId()

  // Creates a change handler for patching data
  const handleChange = React.useCallback(
    // useCallback will help with performance
    (event) => {
      const inputValue = event.currentTarget.value // get current value
      // if the value exists, set the data, if not, unset the data
      onChange(PatchEvent.from(inputValue ? set(inputValue) : unset()))
    },
    [onChange]
  )

  return (
    <Stack space={1}>
      <FormField
        description={type.description}
        title={type.title}
        __unstable_markers={markers} // Handles all markers including validation
        __unstable_presence={presence} // Handles presence avatars
        compareValue={compareValue} // Handles "edited" status
        inputId={inputId} // Allows the label to connect to the input field
      >
        <TextInput
          id={inputId} // A unique ID for this input
          onChange={handleChange} // A function to call when the input value changes
          value={value} // Current field value
          readOnly={readOnly} // If "readOnly" is defined make this field read only
          placeholder={placeholder} // If placeholder is defined, display placeholder text
          onFocus={onFocus} // Handles focus events
          onBlur={onBlur} // Handles blur events
          ref={ref}
        />
      </FormField>
      <Text muted size={1}>
        <strong>Concept IRI: </strong>
        {parent.conceptIriBase ? parent.conceptIriBase.iriValue : '[base URI not defined] '}
        {value?.replaceAll(' ', '')}
      </Text>
    </Stack>
  )
})

export default PrefLabel
