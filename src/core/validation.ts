import {DocumentId, getPublishedId} from '@sanity/id-utils'
import type {SanityDocument} from 'sanity'

/**
 * #### Concept reference filter
 * Reference-field `options.filter` for broader/related concept fields: excludes
 * the concept itself and any concepts already chosen as broader/related, keeping
 * the two relationship sets mutually exclusive. Pure — the host calls it with
 * the current document.
 */
export function conceptFilter({document}: {document: SanityDocument}) {
  const publishedId = getPublishedId(DocumentId(document._id))
  return {
    filter: '!(_id in $broader || _id in $related || _id == $self)',
    params: {
      self: publishedId,
      broader: Array.isArray(document?.broader)
        ? document.broader.map(({_ref}: {_ref: string}) => _ref)
        : [],
      related: Array.isArray(document?.related)
        ? document.related.map(({_ref}: {_ref: string}) => _ref)
        : [],
    },
  }
}

/**
 * #### Preferred-label uniqueness result
 * Given the id of an existing published concept that already uses a candidate
 * prefLabel (or null/undefined if none), decide the validation result. Returns
 * the error message when the match is a *different* document, otherwise `true`.
 * The fetch that finds the existing concept stays in the schema (impure).
 */
export function prefLabelUniquenessResult(
  existingConceptId: string | null | undefined,
  currentDocumentId: string | undefined,
): string | true {
  if (existingConceptId && !currentDocumentId?.includes(existingConceptId)) {
    return 'Preferred Label must be unique.'
  }
  return true
}
