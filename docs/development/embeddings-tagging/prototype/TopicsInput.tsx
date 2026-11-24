// The Topics field's input: the default one, plus recording a person's decisions about the
// tagger's tags in `topicScores` as each change to Topics lands (Andy, 2026-11-12). The rule
// itself is `exclusionPatches` in propose.ts; this only decides WHEN it runs.
//
// ── IT WATCHES THE VALUE OF TOPICS, BECAUSE NO CALLBACK SEES EVERY EDIT ──────────────────
//
// The first version wrapped the input's `onChange`, to act on the editor's own edits only, and
// it missed both ways a tag actually changes:
//
//   - REMOVING an item goes through the array input's `onItemRemove`, a callback of its own, not
//     through `onChange`. Andy's first test removed a tag and nothing was marked.
//   - ADDING a tag through the taxonomy plugin's browse dialog bypasses the input entirely: the
//     plugin writes to the draft with its own client (`patch(id).setIfMissing(…).append(…)`,
//     read out of sanity-plugin-taxonomy-manager 6.2.0's bundle).
//
// So it compares the concepts in Topics from one value to the next, however the change arrived.
// Two guards keep that from writing where it shouldn't:
//
//   - ONLY INTO A DRAFT. A Discard leaves the form showing the published version, with no
//     draft, and a write there would create a fresh draft behind the editor's back. An edit to a
//     published document creates its draft first, so the value this sees already belongs to it.
//   - KEYED ON TOPICS, NOT ON THE SCORES. Undo reverses the mark before the removal (it was the
//     later write), and that changes only `topicScores`, so nothing here runs and re-marks it.
//     A second undo restores the tag, and the rule finds nothing to do.
//
// And it skips its first render: opening a document reads it and never writes. A document left
// inconsistent by an edit made elsewhere is read correctly by the next run of "Suggest topics"
// anyway (propose.ts → TWO OF THESE ROWS).
//
// Several editors with the document open would each see the same change and write the same
// patch; setting `excluded` twice, or unsetting an entry twice, is harmless.
//
// ── TWO WRITES, NOT ONE ──────────────────────────────────────────────────────────────────
//
// An input can only patch its own field, so the entry in `topicScores` is written through
// `useDocumentOperation`, the public document API the action also uses, as a second patch to the
// same draft. The form's document-wide callback would make it one write, but it is marked
// @internal. Hence two undo steps to fully reverse a removal: the mark first, then the removal.
//
// It is on all four types in production too, where it is inert until a document has scores.

import {useEffect, useRef} from 'react'
import {
  getPublishedId,
  isDraftId,
  useDocumentOperation,
  useFormValue,
  type ArrayOfObjectsInputProps,
} from 'sanity'
import {exclusionPatches, type TopicScoreItem} from './propose.ts'

const conceptsOf = (value: unknown) =>
  ((value as ({_ref?: string} | null)[] | undefined) ?? [])
    .map((item) => item?._ref)
    .filter((ref): ref is string => typeof ref === 'string')

export function TopicsInput(props: ArrayOfObjectsInputProps) {
  const {value, renderDefault} = props
  const id = useFormValue(['_id']) as string
  const type = useFormValue(['_type']) as string
  const topicScores = useFormValue(['topicScores']) as TopicScoreItem[] | undefined
  const {patch} = useDocumentOperation(getPublishedId(id), type)

  /* The concepts in Topics at the last value this input saw; null before the first render. */
  const previous = useRef<string[] | null>(null)

  useEffect(() => {
    const now = conceptsOf(value)
    const before = previous.current
    previous.current = now
    if (before === null || !isDraftId(id)) return
    const patches = exclusionPatches(before, now, topicScores)
    if (patches.length && !patch.disabled) patch.execute(patches)
    /* Keyed on the value of Topics alone, on purpose: see KEYED ON TOPICS above. The draft id,
       the scores and the patch API are read as they are when Topics changes. */
  }, [value])

  return renderDefault(props)
}
