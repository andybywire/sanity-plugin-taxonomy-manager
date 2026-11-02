import {describe, expect, it} from 'vitest'

import {
  CONCEPT_SEARCH_LIMIT,
  conceptSearchBuilder,
  inputBuilder,
  publishedConceptsBuilder,
  trunkBuilder,
} from './queries'

// Characterization tests: pin the exact GROQ the builders emit today so the
// Stage 3 extraction into core/ (and making the depth cap configurable) cannot
// silently change behavior. The full strings are snapshotted; the structural
// assertions document the load-bearing parts.

describe('trunkBuilder', () => {
  const query = trunkBuilder()

  it('matches the characterized GROQ output', () => {
    expect(query).toMatchSnapshot()
  })

  it('selects the scheme by $id and projects topConcepts + concepts, ordered by prefLabel', () => {
    expect(query).toContain('*[_id == $id][0]')
    expect(query).toContain('"topConcepts": topConcepts[]->|order(prefLabel)')
    expect(query).toContain('"concepts": concepts[]->|order(prefLabel)')
  })

  it('computes isOrphan via array::intersects of broader refs against the scheme refs', () => {
    expect(query).toContain('"isOrphan":')
    expect(query).toContain('array::intersects')
  })

  it('recurses childConcepts to a depth cap of 6 levels', () => {
    expect(query).toContain('"level": 6')
    expect(query).not.toContain('"level": 7')
  })
})

describe('inputBuilder', () => {
  const query = inputBuilder()

  it('matches the characterized GROQ output', () => {
    expect(query).toMatchSnapshot()
  })

  it('branches on the presence of $branchId via select()', () => {
    expect(query).toContain('select($branchId != null =>')
    expect(query).toContain('$branchId in @->broader[]->.conceptId')
  })

  it('recurses childConcepts to a depth cap of 6 levels', () => {
    expect(query).toContain('"level": 6')
    expect(query).not.toContain('"level": 7')
  })
})

describe('publishedConceptsBuilder', () => {
  const {fetch, listen} = publishedConceptsBuilder()

  it('projects only the ids, so the payload stays one array of strings', () => {
    expect(fetch).toBe(`*[_type == "skosConcept" && _id in $ids]._id`)
  })

  it('scopes the listener to the same ids, so off-screen concepts never wake it', () => {
    expect(listen).toContain('_id in $ids')
    expect(listen).toContain('_type == "skosConcept"')
  })

  it('filters by id rather than by scheme membership, which the published scheme would lag', () => {
    expect(fetch).not.toContain('topConcepts')
    expect(fetch).not.toContain('concepts[]')
  })
})

describe('conceptSearchBuilder', () => {
  const query = conceptSearchBuilder()

  it('excludes the scheme’s existing members', () => {
    expect(query).toContain('!(_id in $excludeIds)')
  })

  it('names the search parameter $searchQuery, not the reserved $query', () => {
    expect(query).toContain('prefLabel match $searchQuery')
    expect(query).not.toMatch(/\$query\b/)
  })

  it('orders by prefLabel and slices to the search limit', () => {
    expect(query).toContain('| order(prefLabel)')
    expect(query).toContain(`[0...${CONCEPT_SEARCH_LIMIT}]`)
  })

  it('projects only what the picker renders and the plan needs', () => {
    expect(query).toContain('"id": _id')
    expect(query).toContain('_originalId')
    expect(query).toContain('prefLabel')
    expect(query).not.toContain('childConcepts')
  })
})

describe('conceptSearchBuilder — browse list', () => {
  const query = conceptSearchBuilder()

  it('leaves out concepts with no preferred label, which sort first and name nothing', () => {
    expect(query).toContain('defined(prefLabel) && prefLabel != ""')
  })

  it('caps the list high enough to browse, not just to typeahead', () => {
    expect(CONCEPT_SEARCH_LIMIT).toBeGreaterThanOrEqual(100)
  })
})
