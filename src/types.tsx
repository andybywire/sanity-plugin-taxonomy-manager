export interface ChildConceptTerm {
  prefLabel: string
  id: string
  level?: number
  childConcepts?: ChildConceptTerm[]
}

export interface TopConceptTerm {
  prefLabel: string
  id: string
  childConcepts?: ChildConceptTerm[]
}

export interface DocumentConcepts {
  topConcepts: TopConceptTerm[]
  orphans: ChildConceptTerm[]
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
