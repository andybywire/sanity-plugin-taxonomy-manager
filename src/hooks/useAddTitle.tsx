import {useCallback} from 'react'
import {useClient} from 'sanity'
import {useToast} from '@sanity/ui'

/**
 * #### Add Title and Description to New Concept Scheme
 * Good for user experience, and also needed to write the
 * new scheme to the content lake, prior to which add top
 * concept / add concept buttons will not work.
 */
export function useAddTitle() {
  const toast = useToast()
  const client = useClient({apiVersion: '2021-10-21'})

  const addTitle = useCallback(
    (document: any, titleValue: string, descriptionValue?: string) => {
      const documentId = document.displayed?._id
      const schemaBaseIri = document.displayed?.baseIri
      const schemeId = document.displayed?.schemeId

      const doc = {
        _id: `drafts.${documentId}`,
        _type: 'skosConceptScheme',
        schemeId: schemeId,
        baseIri: schemaBaseIri,
        title: titleValue,
        description: descriptionValue ? descriptionValue : '',
      }

      client
        .createIfNotExists(doc)
        .then((_) => {
          if (descriptionValue) {
            return toast.push({
              closable: true,
              status: 'success',
              title: 'Title and Description added.',
            })
          }
          return toast.push({
            closable: true,
            status: 'success',
            title: 'Title added.',
          })
        })
        .catch((err) => {
          toast.push({
            closable: true,
            status: 'error',
            title: 'There has been an error',
            description: err.message,
          })
        })
    },
    [client, toast]
  )

  return addTitle
}
