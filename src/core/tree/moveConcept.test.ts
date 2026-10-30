import {describe, expect, it} from 'vitest'

import type {DocumentConcepts} from '../../types'

import {canMoveConcept, MAX_VISIBLE_LEVEL, moveConcept} from './moveConcept'

/**
 * Animals ─┬─ Birds ── Falcons
 *          └─ Mammals
 * Minerals
 * Unfiled (orphan)
 */
const tree = (): DocumentConcepts => ({
  topConcepts: [
    {
      id: 'animals',
      prefLabel: 'Animals',
      childConcepts: [
        {
          id: 'birds',
          prefLabel: 'Birds',
          level: 1,
          childConcepts: [{id: 'falcons', prefLabel: 'Falcons', level: 2}],
        },
        {id: 'mammals', prefLabel: 'Mammals', level: 1},
      ],
    },
    {id: 'minerals', prefLabel: 'Minerals'},
  ],
  concepts: [{id: 'unfiled', prefLabel: 'Unfiled', isOrphan: true}],
})

/** A single chain Animals → l1 → l2 → l3 → l4, for the depth rules. */
const deepTree = (): DocumentConcepts => ({
  topConcepts: [
    {
      id: 'animals',
      prefLabel: 'Animals',
      childConcepts: [
        {
          id: 'l1',
          prefLabel: 'L1',
          level: 1,
          childConcepts: [
            {
              id: 'l2',
              prefLabel: 'L2',
              level: 2,
              childConcepts: [
                {
                  id: 'l3',
                  prefLabel: 'L3',
                  level: 3,
                  childConcepts: [{id: 'l4', prefLabel: 'L4', level: 4}],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  concepts: [
    {
      id: 'movable',
      prefLabel: 'Movable',
      isOrphan: true,
      childConcepts: [
        {
          id: 'movable-child',
          prefLabel: 'Movable Child',
          level: 1,
          // A generation below the concept being moved, so the subtree's height
          // — not just its own landing level — decides whether a drop fits.
          childConcepts: [{id: 'movable-grandchild', prefLabel: 'Movable Grandchild', level: 2}],
        },
      ],
    },
  ],
})

describe('canMoveConcept', () => {
  it('allows moving a nested concept to another nested concept', () => {
    expect(
      canMoveConcept({data: tree(), conceptId: 'falcons', fromParentId: 'birds', toParentId: 'mammals'}),
    ).toEqual({allowed: true})
  })

  it('allows moving a nested concept onto a top concept', () => {
    // Children of a top concept come from the scheme's concepts[] too, so this
    // is still a single patch to a single concept document.
    expect(
      canMoveConcept({data: tree(), conceptId: 'falcons', fromParentId: 'birds', toParentId: 'minerals'}),
    ).toEqual({allowed: true})
  })

  it('rejects dropping a concept on itself', () => {
    const result = canMoveConcept({
      data: tree(),
      conceptId: 'birds',
      fromParentId: 'animals',
      toParentId: 'birds',
    })
    expect(result.allowed).toBe(false)
    expect(result).toHaveProperty('reason', 'A concept cannot be its own broader term.')
  })

  it('rejects dropping a concept where it already sits', () => {
    const result = canMoveConcept({
      data: tree(),
      conceptId: 'falcons',
      fromParentId: 'birds',
      toParentId: 'birds',
    })
    expect(result).toEqual({allowed: false, reason: 'This concept is already here.'})
  })

  it('rejects dropping a concept onto one of its own descendants', () => {
    const result = canMoveConcept({
      data: tree(),
      conceptId: 'birds',
      fromParentId: 'animals',
      toParentId: 'falcons',
    })
    expect(result).toEqual({
      allowed: false,
      reason: 'A concept cannot be moved beneath one of its own narrower terms.',
    })
  })

  it('rejects dropping a concept onto a broader term it already has', () => {
    // Falcons hangs under both Birds and Mammals; dragging the Birds occurrence
    // onto Mammals would duplicate the reference it already holds.
    const poly = tree()
    poly.topConcepts[0].childConcepts![1].childConcepts = [
      {id: 'falcons', prefLabel: 'Falcons', level: 2},
    ]
    const result = canMoveConcept({
      data: poly,
      conceptId: 'falcons',
      fromParentId: 'birds',
      toParentId: 'mammals',
    })
    expect(result).toEqual({
      allowed: false,
      reason: 'This concept already has that broader term.',
    })
  })

  it('rejects a move whose deepest term would fall past the visible depth', () => {
    // Movable carries a child, so landing on L4 would put that child at level 6.
    const result = canMoveConcept({
      data: deepTree(),
      conceptId: 'movable-child',
      fromParentId: 'movable',
      toParentId: 'l4',
    })
    expect(result).toEqual({
      allowed: false,
      reason: `That move would push terms past the maximum hierarchy depth of ${MAX_VISIBLE_LEVEL} levels.`,
    })
  })

  it('allows a move that lands exactly on the visible depth limit', () => {
    expect(
      canMoveConcept({
        data: deepTree(),
        conceptId: 'movable-child',
        fromParentId: 'movable',
        toParentId: 'l3',
      }),
    ).toEqual({allowed: true})
  })

  it('measures depth against the deepest occurrence of a target with several parents', () => {
    const poly = deepTree()
    // L1 also hangs under L3, so its deepest rendering is level 4, not 1.
    poly.topConcepts[0].childConcepts![0].childConcepts![0].childConcepts![0].childConcepts!.push({
      id: 'l1',
      prefLabel: 'L1',
      level: 4,
    })
    const result = canMoveConcept({
      data: poly,
      conceptId: 'movable-child',
      fromParentId: 'movable',
      toParentId: 'l1',
    })
    expect(result.allowed).toBe(false)
  })

  it('rejects a move whose target is not in this tree', () => {
    const result = canMoveConcept({
      data: tree(),
      conceptId: 'falcons',
      fromParentId: 'birds',
      toParentId: 'nowhere',
    })
    expect(result).toEqual({allowed: false, reason: 'That broader term is not part of this tree.'})
  })

  it('rejects a move whose concept is not under the parent it claims', () => {
    const result = canMoveConcept({
      data: tree(),
      conceptId: 'falcons',
      fromParentId: 'mammals',
      toParentId: 'minerals',
    })
    expect(result).toEqual({allowed: false, reason: 'This concept is no longer where it was.'})
  })

  it('rejects a move against a tree that has not loaded', () => {
    expect(
      canMoveConcept({data: null, conceptId: 'a', fromParentId: 'b', toParentId: 'c'}).allowed,
    ).toBe(false)
  })
})

describe('moveConcept', () => {
  it('passes null through', () => {
    expect(moveConcept(null, {conceptId: 'a', fromParentId: 'b', toParentId: 'c'})).toBeNull()
  })

  it('returns the same reference when the concept is not under the parent it claims', () => {
    const data = tree()
    expect(
      moveConcept(data, {conceptId: 'falcons', fromParentId: 'mammals', toParentId: 'minerals'}),
    ).toBe(data)
  })

  it('moves a concept out of its old parent and into the new one', () => {
    const result = moveConcept(tree(), {
      conceptId: 'falcons',
      fromParentId: 'birds',
      toParentId: 'mammals',
    })
    const animals = result!.topConcepts[0]
    expect(animals.childConcepts![0].childConcepts ?? []).toEqual([])
    expect(animals.childConcepts![1].childConcepts!.map((c) => c.id)).toEqual(['falcons'])
  })

  it('inserts the moved concept in alphabetical order among its new siblings', () => {
    const data = tree()
    data.topConcepts[0].childConcepts![1].childConcepts = [
      {id: 'apes', prefLabel: 'Apes', level: 2},
      {id: 'zebras', prefLabel: 'Zebras', level: 2},
    ]
    const result = moveConcept(data, {
      conceptId: 'falcons',
      fromParentId: 'birds',
      toParentId: 'mammals',
    })
    expect(
      result!.topConcepts[0].childConcepts![1].childConcepts!.map((c) => c.prefLabel),
    ).toEqual(['Apes', 'Falcons', 'Zebras'])
  })

  it('re-levels the moved concept and everything beneath it', () => {
    const result = moveConcept(deepTree(), {
      conceptId: 'movable-child',
      fromParentId: 'movable',
      toParentId: 'l2',
    })
    const l2 = result!.topConcepts[0].childConcepts![0].childConcepts![0]
    const moved = l2.childConcepts!.find((c) => c.id === 'movable-child')!
    expect(moved.level).toBe(3)
  })

  it('re-levels a whole subtree, not just the concept moved', () => {
    const data = tree()
    // Give Falcons a child so there is a generation below it to re-level.
    data.topConcepts[0].childConcepts![0].childConcepts![0].childConcepts = [
      {id: 'kestrels', prefLabel: 'Kestrels', level: 3},
    ]
    const result = moveConcept(data, {
      conceptId: 'falcons',
      fromParentId: 'birds',
      toParentId: 'minerals',
    })
    const moved = result!.topConcepts[1].childConcepts![0]
    expect(moved.level).toBe(1)
    expect(moved.childConcepts![0].level).toBe(2)
  })

  it('leaves the other occurrences of a concept with several broader terms alone', () => {
    const data = tree()
    data.topConcepts[1].childConcepts = [{id: 'falcons', prefLabel: 'Falcons', level: 1}]
    const result = moveConcept(data, {
      conceptId: 'falcons',
      fromParentId: 'birds',
      toParentId: 'mammals',
    })
    // The Minerals occurrence is untouched; only the Birds edge moved.
    expect(result!.topConcepts[1].childConcepts!.map((c) => c.id)).toEqual(['falcons'])
    expect(result!.topConcepts[0].childConcepts![1].childConcepts!.map((c) => c.id)).toEqual([
      'falcons',
    ])
  })

  it('inserts under every occurrence of a target that itself has several broader terms', () => {
    const data = tree()
    data.topConcepts[1].childConcepts = [{id: 'mammals', prefLabel: 'Mammals', level: 1}]
    const result = moveConcept(data, {
      conceptId: 'falcons',
      fromParentId: 'birds',
      toParentId: 'mammals',
    })
    expect(result!.topConcepts[0].childConcepts![1].childConcepts!.map((c) => c.id)).toEqual([
      'falcons',
    ])
    expect(result!.topConcepts[1].childConcepts![0].childConcepts!.map((c) => c.id)).toEqual([
      'falcons',
    ])
  })

  it('moves a concept onto an orphan at the root', () => {
    const result = moveConcept(tree(), {
      conceptId: 'falcons',
      fromParentId: 'birds',
      toParentId: 'unfiled',
    })
    expect(result!.concepts[0].childConcepts!.map((c) => c.id)).toEqual(['falcons'])
  })

  it('does not mutate the input', () => {
    const data = tree()
    const snapshot = JSON.stringify(data)
    moveConcept(data, {conceptId: 'falcons', fromParentId: 'birds', toParentId: 'mammals'})
    expect(JSON.stringify(data)).toBe(snapshot)
  })
})

/**
 * Closer to what `trunkBuilder` actually returns: `concepts[]` carries *every*
 * member of the scheme at level 0, orphan or not, and `TreeStructure` filters
 * that list to the orphans. The same concept therefore appears twice — once
 * flat at the root, once nested in a top concept's subtree.
 */
const schemeTree = (): DocumentConcepts => ({
  topConcepts: [
    {
      id: 'animals',
      prefLabel: 'Animals',
      childConcepts: [
        {
          id: 'birds',
          prefLabel: 'Birds',
          level: 1,
          childConcepts: [{id: 'falcons', prefLabel: 'Falcons', level: 2}],
        },
        {id: 'mammals', prefLabel: 'Mammals', level: 1},
      ],
    },
  ],
  concepts: [
    {
      id: 'birds',
      prefLabel: 'Birds',
      level: 0,
      isOrphan: false,
      childConcepts: [{id: 'falcons', prefLabel: 'Falcons', level: 1}],
    },
    {id: 'falcons', prefLabel: 'Falcons', level: 0, isOrphan: false},
    {id: 'mammals', prefLabel: 'Mammals', level: 0, isOrphan: false},
    {id: 'unfiled', prefLabel: 'Unfiled', level: 0, isOrphan: true},
  ],
})

const rootOrphans = (data: DocumentConcepts | null) =>
  (data?.concepts ?? []).filter((c) => c.isOrphan).map((c) => c.id)

describe('canMoveConcept, out of the hierarchy', () => {
  it('allows dropping a nested concept out of the hierarchy', () => {
    expect(
      canMoveConcept({
        data: schemeTree(),
        conceptId: 'falcons',
        fromParentId: 'birds',
        toParentId: null,
      }),
    ).toEqual({allowed: true})
  })

  it('still requires the concept to be where the move says it is', () => {
    expect(
      canMoveConcept({
        data: schemeTree(),
        conceptId: 'falcons',
        fromParentId: 'mammals',
        toParentId: null,
      }),
    ).toEqual({allowed: false, reason: 'This concept is no longer where it was.'})
  })
})

describe('moveConcept, out of the hierarchy', () => {
  it('drops the broader term and marks the concept an orphan at the root', () => {
    const result = moveConcept(schemeTree(), {
      conceptId: 'falcons',
      fromParentId: 'birds',
      toParentId: null,
    })

    expect(result!.topConcepts[0].childConcepts![0].childConcepts ?? []).toEqual([])
    expect(rootOrphans(result)).toEqual(['falcons', 'unfiled'])
  })

  it('clears the concept out of every nested rendering of its former parent', () => {
    const result = moveConcept(schemeTree(), {
      conceptId: 'falcons',
      fromParentId: 'birds',
      toParentId: null,
    })
    // Birds renders both nested under Animals and flat in concepts[].
    const birdsFlat = result!.concepts.find((c) => c.id === 'birds')!
    expect(birdsFlat.childConcepts ?? []).toEqual([])
  })

  it('leaves the concept nested when it still has another broader term in the scheme', () => {
    const data = schemeTree()
    data.topConcepts[0].childConcepts![1].childConcepts = [
      {id: 'falcons', prefLabel: 'Falcons', level: 2},
    ]
    data.concepts[2].childConcepts = [{id: 'falcons', prefLabel: 'Falcons', level: 1}]

    const result = moveConcept(data, {
      conceptId: 'falcons',
      fromParentId: 'birds',
      toParentId: null,
    })

    // Dropping the Birds edge leaves the Mammals one, so Falcons is no orphan.
    expect(rootOrphans(result)).toEqual(['unfiled'])
    expect(result!.topConcepts[0].childConcepts![1].childConcepts!.map((c) => c.id)).toEqual([
      'falcons',
    ])
  })

  it('adds a root entry when the tree carries no flat entry for the concept', () => {
    const result = moveConcept(tree(), {
      conceptId: 'falcons',
      fromParentId: 'birds',
      toParentId: null,
    })
    expect(rootOrphans(result)).toEqual(['falcons', 'unfiled'])
  })

  it('re-levels the surfaced concept and its subtree from the root', () => {
    const data = tree()
    data.topConcepts[0].childConcepts![0].childConcepts![0].childConcepts = [
      {id: 'kestrels', prefLabel: 'Kestrels', level: 3},
    ]
    const result = moveConcept(data, {
      conceptId: 'falcons',
      fromParentId: 'birds',
      toParentId: null,
    })
    const surfaced = result!.concepts.find((c) => c.id === 'falcons')!
    expect(surfaced.level).toBe(0)
    expect(surfaced.childConcepts![0].level).toBe(1)
  })

  it('does not mutate the input', () => {
    const data = schemeTree()
    const snapshot = JSON.stringify(data)
    moveConcept(data, {conceptId: 'falcons', fromParentId: 'birds', toParentId: null})
    expect(JSON.stringify(data)).toBe(snapshot)
  })
})
