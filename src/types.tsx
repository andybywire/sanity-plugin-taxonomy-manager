import type {SanityDocument, FieldDefinition} from 'sanity'

export interface Options {
  baseUri?: string
  customConceptFields?: FieldDefinition[]
  customSchemeFields?: FieldDefinition[]
  ident?: {
    pattern?: string
    length?: number
    prefix?: string
    regenUi?: boolean
  }
}

export interface ChildConceptTerm {
  prefLabel: string
  id: string
  _originalId?: string
  level?: number
  isOrphan?: boolean
  /** True when this concept is among the current semantic recommendations. */
  recommended?: boolean
  hasMatchingDescendant?: boolean
  childConcepts?: ChildConceptTerm[]
}

export interface TopConceptTerm {
  prefLabel: string
  id: string
  _originalId?: string
  /** True when this concept is among the current semantic recommendations. */
  recommended?: boolean
  hasMatchingDescendant?: boolean
  childConcepts?: ChildConceptTerm[]
}

export interface DocumentConcepts {
  topConcepts: TopConceptTerm[]
  concepts: ChildConceptTerm[]
}

export interface PrefLabelValue {
  value: string

  renderDefault: (props: PrefLabelValue) => React.ReactElement
}

export interface ConceptDetailLinkProps {
  concept: {
    id: string
    prefLabel: string
    childConcepts?: ChildConceptTerm[]
    level?: number
  }
}

export interface SkosConceptReference {
  _key: string
  _ref: string
  _type: 'reference'
  _strengthenOnPublish?: {
    type: 'skosConcept'
    template?: {id: 'skosConcept'}
  }
  _weak?: boolean
}

export interface SkosConceptDocument {
  _id: string
  _type: 'skosConcept'
  conceptId: string
  prefLabel: string
  baseIri: string | undefined
  broader: SkosConceptReference[]
  related: SkosConceptReference[]
  // Optional fields from the schema
  definition?: string
  example?: string
  scopeNote?: string
  altLabel?: string[]
  hiddenLabel?: string[]
  historyNote?: string
  editorialNote?: string
  changeNote?: string
}

export interface ConceptSchemeDocument extends SanityDocument {
  displayed: {
    _id: string
    _type: 'skosConceptScheme'
    title?: string
    description?: string
    baseIri?: string
    schemeId?: string
    topConcepts?: Array<{
      _key: string
      _ref: string
      _type: 'reference'
    }>
    concepts?: Array<{
      _key: string
      _ref: string
      _type: 'reference'
    }>
  }
}

/**
 * A semantic match score for a single concept, keyed by its published document id.
 * Produced by the recommendations seam and merged into the hierarchy tree by
 * `annotateRecommendations`. The GROQ `text::semanticSimilarity()` projection owns
 * this shape directly — no wrapper object, no document type.
 */
export interface ConceptRecommendation {
  conceptId: string
  score: number
}

/**
 * Configuration for the input components' semantic term recommendations. When
 * provided, opening the tree browser scores concepts against the dataset's
 * embeddings (via `text::semanticSimilarity()`) using the current values of the
 * referenced fields, and annotates matching terms with a relevance score.
 *
 * Requires [dataset embeddings](https://www.sanity.io/docs/content-lake/dataset-embeddings)
 * to be enabled; without them the tree still renders, just without scores.
 */
export interface SemanticSearchConfig {
  /**
   * Field names on the current document whose values are concatenated into the
   * search query. Every listed field must hold a value when the tree is opened;
   * empty fields surface a message in the tree view instead of scores.
   */
  fieldReferences: string[]
  /** Maximum number of matching terms to return. Defaults to `3`. */
  maxResults?: number
}

export interface TreeViewProps {
  document?: ConceptSchemeDocument
  branchId?: string | null
  selectConcept?: (conceptId: {_ref: string; _type: 'reference'; _originalId?: string}) => void
  inputComponent?: boolean
  expanded?: boolean
  conceptRecs?: ConceptRecommendation[]
  recsError?: string | null
}
