import {describe, expect, it} from 'vitest'

import {inputBuilder, publishedConceptsBuilder, trunkBuilder} from './queries'

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
