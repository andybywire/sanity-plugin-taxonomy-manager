import {useState, useCallback} from 'react'
import {useClient, useDataset, useGetFormValue} from 'sanity'

import type {EmbeddingsIndexConfig, EmbeddingsResult} from '../types'

/**
 * Queries a Sanity embeddings index using values from specified form fields.
 * Returns matching concept scores and any validation errors.
 */
export function useEmbeddingsRecs(embeddingsIndex?: EmbeddingsIndexConfig) {
  const client = useClient({apiVersion: 'vX'})
  const dataset = useDataset()
  const getFormValue = useGetFormValue()

  const [conceptRecs, setConceptRecs] = useState<EmbeddingsResult[]>([])
  const [recsError, setRecsError] = useState<string | null>(null)

  const buildQueryString = useCallback(
    (fieldReferences: string[]): string => {
      const emptyFields: string[] = []
      const values = fieldReferences.map((fieldName) => {
        const val = getFormValue([fieldName])
        if (typeof val === 'string' && val.trim() !== '') {
          return val
        }
        emptyFields.push(fieldName)
        return ''
      })
      if (emptyFields.length === 1) {
        throw new Error(`Please fill out the ${emptyFields[0]} field to enable match scores.`)
      } else if (emptyFields.length > 1) {
        throw new Error(
          `The following fields must be filled out to enable match scores: ${emptyFields.join(
            ', '
          )}`
        )
      }
      return values.filter(Boolean).join(' ')
    },
    [getFormValue]
  )

  const fetchConceptRecs = useCallback(
    async (query: string, indexName: string, maxResults: number) => {
      const returnedRecs: EmbeddingsResult[] = await client.request({
        url: `/embeddings-index/query/${dataset}/${indexName}`,
        method: 'POST',
        body: {
          query,
          maxResults,
        },
      })
      setConceptRecs(returnedRecs)
    },
    [client, dataset]
  )

  const triggerEmbeddingsSearch = useCallback(() => {
    setRecsError(null)
    if (!embeddingsIndex) return
    const {indexName, fieldReferences, maxResults = 3} = embeddingsIndex
    try {
      const query = buildQueryString(fieldReferences)
      fetchConceptRecs(query, indexName, maxResults).catch((error) =>
        console.error('Error with embeddings index fetch: ', error)
      )
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'One or more required fields are empty'
      setRecsError(errorMessage)
    }
  }, [buildQueryString, embeddingsIndex, fetchConceptRecs])

  return {conceptRecs, recsError, triggerEmbeddingsSearch}
}
