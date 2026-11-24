// "Suggest topics": the stopgap tagger, run by hand from a document (Andy, 2026-11-06).
//
// ── WHY A DOCUMENT ACTION AND NOT A SANITY FUNCTION ──────────────────────────────────────
//
// A Function runs on a document event, on a schedule, or when another Function calls it; the
// Studio can't call one. Running one "from the Studio" would mean an action writing a request
// that a Function watches, plus a Blueprint and a deploy, and its natural job, tagging on
// publish, writes after the publish: a second deploy, and no review. This runs in the Studio
// with the signed-in user's session, and writes to the draft.
//
// ── THE FLOW ─────────────────────────────────────────────────────────────────────────────
//
//   1. confirm   what a run costs: one semantic search per Topic concept
//   2. scoring   progress, with nothing written
//   3. review    every concept the result touches, with its score and what happens to it
//   4. apply     `topic` and `topicScores` set on the draft, to review in the form and publish
//
// The rules for reading a document's current tags, and what a run changes, are in propose.ts;
// how a document is scored is in score.ts.
//
// ── NO @sanity/ui, ON PURPOSE ────────────────────────────────────────────────────────────
//
// It isn't a dependency of studio/, and adding it re-resolves other packages in the shared
// lockfile, which was tried and rolled back on 2026-10-22; a lockfile change on `main` deploys
// both hosts. So the dialogs are the Studio's own, through the action API, and the one table is
// plain HTML that inherits the dialog's type and color.

import {useCallback, useRef, useState} from 'react'
import {PiTag} from 'react-icons/pi'
import {useClient, useDocumentOperation, type DocumentActionComponent} from 'sanity'
import {proposeTags, type Proposal, type TopicRef, type TopicScoreItem} from './propose.ts'
import {fetchConcepts, scoreDocument, type QueryFn} from './score.ts'
import {ROUND_0} from './tagger.ts'

/** The types the tagger tags: the four that carry `topic`. */
export const TAGGED_TYPES = ['article', 'caseStudy', 'note', 'presentation']

/** An embedding follows its document by up to a minute or so (score.ts). */
const EMBEDDING_LAG_MS = 90_000

type Run =
  | {step: 'idle'}
  | {step: 'confirm'}
  | {step: 'scoring'; done: number; total: number}
  | {step: 'review'; proposal: Proposal; labels: Map<string, string>}
  | {step: 'error'; message: string}

const newKey = () => crypto.randomUUID().replaceAll('-', '').slice(0, 12)

export const SuggestTopicsAction: DocumentActionComponent = (props) => {
  const {id, type, draft, published} = props
  const client = useClient({apiVersion: '2026-08-18'})
  const {patch} = useDocumentOperation(id, type)
  const [run, setRun] = useState<Run>({step: 'idle'})
  /* Bumped whenever a run is abandoned, so a run still in flight can tell its result is stale. */
  const generation = useRef(0)

  const doc = draft ?? published
  const close = useCallback(() => {
    generation.current++
    setRun({step: 'idle'})
  }, [])

  const score = useCallback(async () => {
    if (!doc) return
    const mine = ++generation.current
    const query: QueryFn = (q, params, perspective) => client.fetch(q, params, {perspective})
    try {
      const concepts = await fetchConcepts(query)
      setRun({step: 'scoring', done: 0, total: concepts.length})
      const candidates = await scoreDocument(query, doc._id, concepts, ROUND_0, (done, total) => {
        if (mine === generation.current) setRun({step: 'scoring', done, total})
      })
      const proposal = proposeTags({
        topic: doc.topic as TopicRef[] | undefined,
        topicScores: doc.topicScores as TopicScoreItem[] | undefined,
        candidates,
        broaderOf: new Map(concepts.map((c) => [c._id, c.parent])),
        config: ROUND_0,
        now: new Date().toISOString(),
        newKey,
      })
      /* Author tags may sit outside the scheme, so their labels come from a second, ordinary
         query rather than from the concepts already fetched. */
      const labels = new Map(concepts.map((c) => [c._id, c.prefLabel ?? c._id]))
      const unlabeled = proposal.authorTags.filter((c) => !labels.has(c))
      if (unlabeled.length) {
        const rows = await query<{_id: string; prefLabel: string | null}[]>(
          `*[_id in $ids]{_id, prefLabel}`,
          {ids: unlabeled},
          'published',
        )
        for (const r of rows) labels.set(r._id, r.prefLabel ?? r._id)
      }
      if (mine === generation.current) setRun({step: 'review', proposal, labels})
    } catch (error) {
      if (mine === generation.current) {
        setRun({step: 'error', message: error instanceof Error ? error.message : String(error)})
      }
    }
  }, [client, doc])

  const apply = useCallback(
    (proposal: Proposal) => {
      patch.execute([{set: {topic: proposal.topic, topicScores: proposal.topicScores}}])
      close()
    },
    [patch, close],
  )

  const recentlyEdited =
    draft?._updatedAt && Date.now() - new Date(draft._updatedAt).getTime() < EMBEDDING_LAG_MS

  return {
    label: 'Suggest topics',
    icon: PiTag,
    disabled: !doc || Boolean(patch.disabled),
    title: doc ? undefined : 'Save the document first: the tagger scores what has been saved.',
    onHandle: () => setRun({step: 'confirm'}),
    dialog:
      run.step === 'confirm'
        ? {
            type: 'confirm',
            message: (
              <div>
                <p>
                  Score this document against every Topic concept? Each concept is one semantic
                  search, against the monthly quota. Nothing is written until you apply.
                </p>
                {recentlyEdited && (
                  <p>
                    The draft was edited in the last minute or so, and its embedding may not include
                    that edit yet.
                  </p>
                )}
              </div>
            ),
            confirmButtonText: 'Score',
            onConfirm: () => {
              setRun({step: 'scoring', done: 0, total: 0})
              void score()
            },
            onCancel: close,
          }
        : run.step === 'scoring'
          ? {
              type: 'dialog',
              header: 'Suggest topics',
              content: (
                <p>
                  {run.total
                    ? `Scored ${run.done} of ${run.total} concepts…`
                    : 'Reading the Topic scheme…'}
                </p>
              ),
              onClose: close,
            }
          : run.step === 'review'
            ? {
                type: 'confirm',
                message: <Review proposal={run.proposal} labels={run.labels} />,
                confirmButtonText: 'Apply to draft',
                cancelButtonText: 'Discard',
                onConfirm: () => apply(run.proposal),
                onCancel: close,
              }
            : run.step === 'error'
              ? {
                  type: 'dialog',
                  header: 'Suggest topics',
                  content: <p>{run.message}</p>,
                  onClose: close,
                }
              : null,
  }
}

SuggestTopicsAction.displayName = 'SuggestTopicsAction'

/** What happens to each concept, in the words the review table uses. */
type Row = {concept: string; score: number | null; what: string}

/**
 * The result as one table: the tags the draft would get, in order, then what it would lose and
 * what stays excluded. Every number is on the anchored scale, where a tag needs 0.45.
 */
function Review({proposal, labels}: {proposal: Proposal; labels: Map<string, string>}) {
  const added = new Set(proposal.added)
  const newly = new Set(proposal.newlyExcluded)

  const rows: Row[] = [
    ...proposal.tags.map((t) => ({
      concept: t.concept,
      score: t.score,
      what:
        t.slot === 'author'
          ? 'yours, kept'
          : added.has(t.concept)
            ? t.slot === 'minimum'
              ? 'new: the best match, under the bar'
              : 'new'
            : 'kept',
    })),
    ...proposal.dropped.map((c) => ({
      concept: c,
      score: proposal.scores.get(c) ?? null,
      what: 'dropped: no longer earns a slot',
    })),
    ...proposal.excluded.map((c) => ({
      concept: c,
      score: proposal.scores.get(c) ?? null,
      what: newly.has(c) ? 'excluded: you removed it' : 'excluded',
    })),
  ]
  const changed = proposal.added.length || proposal.dropped.length || proposal.newlyExcluded.length

  return (
    <div>
      <p>
        {changed
          ? 'Applying sets these on the draft, to review in the form and publish.'
          : 'No change to the tags. Applying refreshes their scores.'}
      </p>
      <table style={{borderCollapse: 'collapse', width: '100%'}}>
        <thead>
          <tr>
            <th style={{textAlign: 'left', padding: '0.25em 0.75em 0.25em 0'}}>Concept</th>
            <th style={{textAlign: 'right', padding: '0.25em 0.75em'}}>Score</th>
            <th style={{textAlign: 'left', padding: '0.25em 0 0.25em 0.75em'}}>Result</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={`${r.concept}-${r.what}`}
              /* A tint of the dialog's own text color, so the rule follows light and dark. */
              style={{borderTop: '1px solid color-mix(in srgb, currentColor 20%, transparent)'}}
            >
              <td style={{padding: '0.25em 0.75em 0.25em 0'}}>
                {labels.get(r.concept) ?? r.concept}
              </td>
              <td
                style={{
                  textAlign: 'right',
                  padding: '0.25em 0.75em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {typeof r.score === 'number' ? r.score.toFixed(3) : '—'}
              </td>
              <td style={{padding: '0.25em 0 0.25em 0.75em'}}>{r.what}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {proposal.pruned.length > 0 && (
        <p>
          {proposal.pruned.length} exclusion{proposal.pruned.length === 1 ? '' : 's'} for concepts
          no longer in the scheme will be removed.
        </p>
      )}
    </div>
  )
}
