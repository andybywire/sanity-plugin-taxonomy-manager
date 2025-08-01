import type {SanityDocument} from 'sanity'

export interface ChildConceptTerm {
  prefLabel: string
  id: string
  _originalId?: string
  level?: number
  isOrphan?: boolean
  childConcepts?: ChildConceptTerm[]
}

export interface TopConceptTerm {
  prefLabel: string
  id: string
  _originalId?: string
  childConcepts?: ChildConceptTerm[]
}

export interface DocumentConcepts {
  topConcepts: TopConceptTerm[]
  concepts: ChildConceptTerm[]
}

export interface PrefLabelValue {
  value: string
  // eslint-disable-next-line
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

export interface TreeViewProps {
  document?: ConceptSchemeDocument
  branchId: string
  selectConcept?: (conceptId: {_ref: string; _type: 'reference'; _originalId?: string}) => void
  inputComponent?: boolean
}
