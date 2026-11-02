import {DndContext, useDndContext} from '@dnd-kit/core'
import {render} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {TreeContext} from '../context'
import type {ChildConceptTerm, DocumentConcepts} from '../types'

import {conceptRowDndIds, useConceptRowDnd} from './useConceptRowDnd'

/**
 * Birds ── Falcons
 *
 * `Move to…` renders a second tree of the *same* concepts inside the same
 * `DndContext` as the structure tree behind it, so both trees hold a row for
 * this edge while the dialog is open.
 */
const FALCONS: ChildConceptTerm = {id: 'falcons', prefLabel: 'Falcons', level: 1}
const TREE: DocumentConcepts = {
  topConcepts: [{id: 'birds', prefLabel: 'Birds', childConcepts: [FALCONS]}],
  concepts: [],
}

/** One row, wired as `ConceptRow` wires it. The dialog's rows take no drops. */
function Row({droppable}: {droppable: boolean}) {
  const dnd = useConceptRowDnd({
    concept: FALCONS,
    parentId: 'birds',
    draggable: droppable,
    droppable,
  })
  return <div ref={dnd.setRowRef} />
}

/** Reports dnd-kit's droppable registry out of the context under test. */
function Registry({onRead}: {onRead: (ids: string[]) => void}) {
  const {droppableContainers} = useDndContext()
  onRead(droppableContainers.getEnabled().map((container) => String(container.id)))
  return null
}

function Tree({pickerOpen, onRead}: {pickerOpen: boolean; onRead: (ids: string[]) => void}) {
  return (
    <TreeContext.Provider value={{concepts: TREE} as never}>
      <DndContext>
        <Row droppable />
        {pickerOpen && <Row droppable={false} />}
        <Registry onRead={onRead} />
      </DndContext>
    </TreeContext.Provider>
  )
}

describe('conceptRowDndIds', () => {
  it('keeps the structure tree and a picker tree in separate id spaces', () => {
    const treeRow = conceptRowDndIds({conceptId: 'falcons', parentId: 'birds', droppable: true})
    const pickerRow = conceptRowDndIds({conceptId: 'falcons', parentId: 'birds', droppable: false})

    expect(treeRow.droppableId).not.toBe(pickerRow.droppableId)
    expect(treeRow.draggableId).not.toBe(pickerRow.draggableId)
  })

  it('still tells apart the two occurrences of a concept with several parents', () => {
    const underBirds = conceptRowDndIds({conceptId: 'falcons', parentId: 'birds', droppable: true})
    const atRoot = conceptRowDndIds({conceptId: 'falcons', parentId: null, droppable: true})

    expect(underBirds.droppableId).not.toBe(atRoot.droppableId)
  })
})

describe('the droppable registry, across a Move to… dialog', () => {
  // dnd-kit keys its registry by id: registering overwrites whatever held that
  // id, and unregistering deletes it. The hook that was overwritten never
  // registers again, because the effect that would do so is keyed on the id,
  // which never changed. Sharing ids between the two trees therefore left the
  // structure tree with no drop targets at all once the dialog had been opened
  // and closed — the drag would start and then have nowhere to land, with no
  // highlight either way, until the view was reloaded.
  it('keeps the tree registered while the dialog is open', () => {
    let ids: string[] = []
    render(<Tree pickerOpen onRead={(read) => (ids = read)} />)

    expect(ids).toEqual(['drop:tree:birds:falcons'])
  })

  it('keeps the tree registered after the dialog closes', () => {
    let ids: string[] = []
    const onRead = (read: string[]) => {
      ids = read
    }
    const {rerender} = render(<Tree pickerOpen onRead={onRead} />)

    rerender(<Tree pickerOpen={false} onRead={onRead} />)

    expect(ids).toEqual(['drop:tree:birds:falcons'])
  })
})
