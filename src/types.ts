/**
 * @todo Troubleshoot PrefLableValue interface declaration. `components: {input: }` in skosConcept.tsx doesn't like it. 
 */

import {SanityDocument} from '@sanity/client'

export interface TopConceptTerms {
  prefLabel: string;
  id: string;
  childConcepts?: ChildConceptTerms[];
}

export interface ChildConceptTerms {
  prefLabel: string;
  id: string;
  childConcepts?: ChildConceptTerms[];
}

export interface DocumentVersionsCollection {
  displayed: SanityDocument
  published: SanityDocument
  draft: SanityDocument
  historical: SanityDocument
}

export interface PrefLabelValue {
  value: string;
  renderDefault: (props: PrefLabelValue) => React.ReactElement
}