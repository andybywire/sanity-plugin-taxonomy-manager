import {describe, expect, it} from 'vitest'

import {
  assembleQueryText,
  recommendationsErrorMessage,
  recommendationsQuery,
  toConceptRecommendations,
} from './semanticRecommendations'

describe('recommendationsQuery', () => {
  const query = recommendationsQuery()

  it('matches the characterized GROQ output', () => {
    expect(query).toMatchSnapshot()
  })

  it('scores skosConcepts by semanticSimilarity and returns the top $maxResults', () => {
    expect(query).toContain('*[_type == "skosConcept"]')
    expect(query).toContain('score(text::semanticSimilarity($query))')
    expect(query).toContain('order(_score desc)')
    expect(query).toContain('[0...$maxResults]')
    expect(query).toContain('"conceptId": _id')
    expect(query).toContain('"score": _score')
  })

  it('uses no part of the deprecated Embeddings Index API', () => {
    expect(query).not.toContain('text::embedding')
    expect(query).not.toContain('embeddings-index')
  })
})

describe('assembleQueryText', () => {
  it('joins the non-empty field values with a space, in order', () => {
    const text = assembleQueryText([
      {name: 'title', value: 'Summer'},
      {name: 'description', value: 'reading list'},
    ])
    expect(text).toBe('Summer reading list')
  })

  it('throws naming the single empty field', () => {
    expect(() =>
      assembleQueryText([
        {name: 'title', value: 'Summer'},
        {name: 'description', value: ''},
      ])
    ).toThrowError('Please fill out the description field to enable match scores.')
  })

  it('throws listing every empty field when more than one is empty', () => {
    expect(() =>
      assembleQueryText([
        {name: 'title', value: ''},
        {name: 'description', value: '   '},
      ])
    ).toThrowError(
      'The following fields must be filled out to enable match scores: title, description'
    )
  })

  it('treats whitespace-only and non-string values as empty', () => {
    expect(() =>
      assembleQueryText([
        {name: 'title', value: '  '},
        {name: 'count', value: 42},
      ])
    ).toThrowError(
      'The following fields must be filled out to enable match scores: title, count'
    )
  })
})

describe('toConceptRecommendations', () => {
  it('maps rows to {conceptId, score}', () => {
    const recs = toConceptRecommendations([
      {conceptId: 'concept-a', score: 0.9},
      {conceptId: 'concept-b', score: 0.4},
    ])
    expect(recs).toEqual([
      {conceptId: 'concept-a', score: 0.9},
      {conceptId: 'concept-b', score: 0.4},
    ])
  })

  it('normalizes draft and version ids to their published form', () => {
    const recs = toConceptRecommendations([
      {conceptId: 'drafts.concept-a', score: 0.9},
      {conceptId: 'versions.rABC.concept-b', score: 0.4},
    ])
    expect(recs).toEqual([
      {conceptId: 'concept-a', score: 0.9},
      {conceptId: 'concept-b', score: 0.4},
    ])
  })

  it('drops rows missing a string id or numeric score', () => {
    const recs = toConceptRecommendations([
      {conceptId: 'concept-a', score: 0.9},
      {conceptId: '', score: 0.5},
      {conceptId: 'concept-c', score: null as unknown as number},
      null as unknown as {conceptId: string; score: number},
    ])
    expect(recs).toEqual([{conceptId: 'concept-a', score: 0.9}])
  })

  it('returns an empty array for null or undefined input', () => {
    expect(toConceptRecommendations(null)).toEqual([])
    expect(toConceptRecommendations(undefined)).toEqual([])
  })
})

describe('recommendationsErrorMessage', () => {
  it('flags an embeddings-related error as the dataset not being enabled', () => {
    const message = recommendationsErrorMessage(
      new Error('text::semanticSimilarity requires embeddings to be enabled')
    )
    expect(message).toBe("Semantic recommendations aren't enabled for this dataset.")
  })

  it('falls back to a generic message for any other failure', () => {
    expect(recommendationsErrorMessage(new Error('Network request failed'))).toBe(
      'Unable to load semantic recommendations.'
    )
    expect(recommendationsErrorMessage('socket hang up')).toBe(
      'Unable to load semantic recommendations.'
    )
    expect(recommendationsErrorMessage(undefined)).toBe('Unable to load semantic recommendations.')
  })
})
