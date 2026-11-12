import {describe, expect, it} from 'vitest'

import {
  CONCEPT_SEARCH_LIMIT,
  conceptSearchBuilder,
  conceptUseBuilder,
  conceptUsageBuilder,
  inputBuilder,
  publishedConceptsBuilder,
  TAGGED_RESOURCE_FILTER,
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

describe('TAGGED_RESOURCE_FILTER', () => {
  it('counts neither concepts nor schemes, so broader/related links are not "use"', () => {
    expect(TAGGED_RESOURCE_FILTER).toContain('_type != "skosConcept"')
    expect(TAGGED_RESOURCE_FILTER).toContain('_type != "skosConceptScheme"')
  })

  // Pinning the mechanism of a bug no build step can see. The usage-query
  // spike excluded system documents with `path("system.**")`, which matches
  // nothing: system documents carry ids under `_.**` — `_.groups.administrator`,
  // `_.releases.<name>`, `_.schemas.<id>` — under `raw` and under a perspective
  // alike. Measured against zw90ihi2/dev: `path("system.**")` returned 0 of
  // them, `path("_.**")` returned all 14. Nothing was miscounted only because
  // no system document happened to reference a concept.
  it('excludes system documents by the id prefix they actually carry', () => {
    expect(TAGGED_RESOURCE_FILTER).toContain('path("_.**")')
    expect(TAGGED_RESOURCE_FILTER).not.toContain('path("system.**")')
  })

  // Every clause is on Sanity's documented list of optimizable filter
  // expressions, so the whole predicate pushes down to the index instead of
  // over-fetching. `_type in [...]` was measured to push down too, but it is
  // not on that list, and `count()` is optimizable only if its interior is
  // *completely* optimizable — so the documented form is the one worth keeping.
  it('uses the documented-optimizable != form rather than `_type in [...]`', () => {
    expect(TAGGED_RESOURCE_FILTER).not.toContain('_type in [')
  })
})

describe('conceptUsageBuilder', () => {
  const {fetch, listen} = conceptUsageBuilder()

  it('matches the characterized GROQ output', () => {
    expect(fetch).toMatchSnapshot()
    expect(listen).toMatchSnapshot()
  })

  it('scopes the terms to the ids the tree is showing', () => {
    expect(fetch).toContain('_type == "skosConcept" && _id in $ids')
  })

  it('counts with references(^._id), the form the query planner optimizes', () => {
    expect(fetch).toContain('count(')
    expect(fetch).toContain('references(^._id)')
  })

  it('shares one content predicate with ConceptUseView, so the two cannot disagree', () => {
    expect(fetch).toContain(TAGGED_RESOURCE_FILTER)
  })

  it('projects only the id and the count — the tree already holds the labels', () => {
    expect(fetch).toContain('"id": _id')
    expect(fetch).toContain('"uses":')
    expect(fetch).not.toContain('prefLabel')
    expect(fetch).not.toContain('childConcepts')
  })

  it('wakes only for documents that tag one of these concepts', () => {
    expect(listen).toContain('references($ids)')
    expect(listen).toContain(TAGGED_RESOURCE_FILTER)
  })
})

describe('conceptUseBuilder', () => {
  const query = conceptUseBuilder()

  it('matches the characterized GROQ output', () => {
    expect(query).toMatchSnapshot()
  })

  it('scopes to the one concept by $refId', () => {
    expect(query).toContain('references($refId)')
  })

  it('projects what Preview renders and nothing more', () => {
    expect(query).toContain('{_id,_type,title}')
  })
})

describe('the rollup and the per-concept list agree', () => {
  // A steward who opens a term showing 12 and counts 11 rows has no reason to
  // trust either number again. Sharing one predicate makes that impossible
  // rather than merely unlikely, so the agreement is asserted directly.
  it('count what the same predicate counts', () => {
    expect(conceptUsageBuilder().fetch).toContain(TAGGED_RESOURCE_FILTER)
    expect(conceptUseBuilder()).toContain(TAGGED_RESOURCE_FILTER)
  })

  it('neither carries a predicate of its own', () => {
    for (const query of [conceptUsageBuilder().fetch, conceptUseBuilder()]) {
      expect(query).not.toContain('_type in [')
      expect(query).not.toContain('path("system.**")')
    }
  })
})
