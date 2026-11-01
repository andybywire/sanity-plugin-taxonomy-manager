import {Box, Card, Dialog, Spinner, Stack, Text} from '@sanity/ui'
import {Autocomplete} from '@sanity/ui/autocomplete'
import {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react'

import {SchemeContext} from '../../context'
import type {ConceptSearchResult} from '../../core/ports'
import {useInsertConcept, useInsertRootConcept} from '../../hooks'
import {useTaxonomyDataPort} from '../../seams/TaxonomyPortContext'
import type {ChildConceptTerm, ConceptSchemeDocument} from '../../types'

/** How long typing settles before a search runs. */
const DEBOUNCE_MS = 200

/**
 * #### Insert Concept Dialog
 * Picks one concept that is not yet in this scheme and files it under the row's
 * concept.
 *
 * Built on `@sanity/ui`'s `Autocomplete` with our own query rather than on
 * Studio's search components: every one of those is `@internal`, and this
 * plugin spans a range of `sanity` peers (ADR 0004). The predicate — concepts
 * *not* in this scheme — is not expressible through Studio's search anyway, so
 * a query of our own was needed either way; what we decline is the coupling.
 *
 * One concept at a time, which `Autocomplete` is built for. Adding several at
 * once is a different mechanism, deliberately not this one.
 *
 * Deliberately *not* `openOnFocus`. With it, clicking inside the dialog but
 * beside the open list closed the list and then immediately reopened it: the
 * click dismissed the popover, focus returned to the input, and focus is what
 * reopened it. The chevron is the way to browse, which is what it is for.
 */
/**
 * Where the picked concept goes. `child` is the row control: it becomes a child
 * of that concept. `topConcept` and `concept` are the scheme-level menu: the
 * concept joins the scheme at its root, with no broader term written.
 */
export type InsertTarget =
  {kind: 'child'; concept: ChildConceptTerm} | {kind: 'topConcept'} | {kind: 'concept'}

/** Headings for the two root targets; the child case names its parent. */
const ROOT_HEADING = {
  topConcept: 'Add an existing concept as a top concept',
  concept: 'Add an existing concept',
} as const

export function InsertConceptDialog({
  target,
  onClose,
}: {
  target: InsertTarget
  onClose: () => void
}) {
  const document: ConceptSchemeDocument = useContext(SchemeContext) || ({} as ConceptSchemeDocument)
  const port = useTaxonomyDataPort()
  const searchConcepts = port.useSearchConcepts()
  const insertConcept = useInsertConcept(document)
  const insertRootConcept = useInsertRootConcept(document)

  // SKOS says a top concept holds no broader term inside its own scheme, so
  // those candidates are not eligible. A broader term elsewhere is no bar.
  const allowBroaderInScheme = target.kind !== 'topConcept'
  const dialogKey = target.kind === 'child' ? target.concept.id : target.kind

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ConceptSearchResult[]>([])
  const [loading, setLoading] = useState(false)

  // The scheme's own members, which the search excludes. Taken from the scheme
  // document rather than the rendered tree: a member nested out of view is
  // still a member, and offering it would file it under a second parent by
  // accident.
  const excludeIds = useMemo(() => {
    const {topConcepts = [], concepts = []} = document.displayed ?? {}
    return [...topConcepts, ...concepts].map((reference) => reference._ref)
  }, [document.displayed])

  // Only the newest search may set state: a slow early request must not
  // overwrite the results of a later, faster one.
  const latestSearch = useRef(0)

  useEffect(() => {
    const trimmed = query.trim()
    // An empty box lists what is available rather than nothing, so opening the
    // dropdown is a way to browse. `*` matches every label.
    const searchQuery = trimmed ? `${trimmed}*` : '*'
    // Nothing has been typed, so there is nothing to wait for: the browse list
    // should be there when the dropdown opens.
    const delay = trimmed ? DEBOUNCE_MS : 0

    setLoading(true)
    const ticket = ++latestSearch.current
    const timer = setTimeout(() => {
      searchConcepts({excludeIds, searchQuery, allowBroaderInScheme})
        .then((found) => {
          if (ticket !== latestSearch.current) return
          setResults(found)
          setLoading(false)
        })
        .catch(() => {
          if (ticket !== latestSearch.current) return
          setResults([])
          setLoading(false)
        })
    }, delay)

    return () => clearTimeout(timer)
  }, [query, excludeIds, searchConcepts, allowBroaderInScheme])

  const options = useMemo(
    () => results.map((result) => ({value: result.id, payload: result})),
    [results],
  )

  const handleSelect = useCallback(
    (value: string) => {
      const picked = results.find((result) => result.id === value)
      if (!picked) return
      if (target.kind === 'child') insertConcept(picked, target.concept)
      else insertRootConcept(picked, target.kind)
      onClose()
    },
    [results, insertConcept, insertRootConcept, target, onClose],
  )

  return (
    <Dialog
      header={
        target.kind === 'child'
          ? `Insert an existing concept as a child of "${
              target.concept.prefLabel || 'this concept'
            }"`
          : ROOT_HEADING[target.kind]
      }
      id={`insert-concept-${dialogKey}`}
      onClose={onClose}
      width={1}
    >
      <Box padding={4}>
        <Stack gap={3}>
          <Autocomplete
            id={`insert-concept-search-${dialogKey}`}
            options={options}
            // Filtering is the query's job; re-filtering here would hide
            // matches GROQ found by a word other than the first.
            filterOption={() => true}
            loading={loading}
            onQueryChange={(next) => setQuery(next ?? '')}
            onSelect={handleSelect}
            openButton
            placeholder="Search or browse concepts"
            renderOption={(option) => (
              // A Card rendered as a button, which is what gives an option its
              // hover state and pointer cursor. A plain Box looks identical
              // until you try to click it: no highlight, and the cursor stays
              // the text I-beam. Studio's own reference input does the same.
              <Card as="button" type="button" padding={3} radius={2} tone="inherit">
                <Text size={2} textOverflow="ellipsis">
                  {option.payload.prefLabel}
                </Text>
              </Card>
            )}
          />
          {loading && (
            <Box paddingTop={2}>
              <Spinner muted size={1} />
            </Box>
          )}
          <Text muted size={1}>
            Only concepts not already in this scheme are shown.
          </Text>
        </Stack>
      </Box>
    </Dialog>
  )
}
