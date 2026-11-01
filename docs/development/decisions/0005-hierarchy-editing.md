# ADR 0005 — Hierarchy editing: the concept-mutation surface

**Status:** accepted. Extends [ADR 0001](0001-pure-core-data-port.md), whose pure-core/data-port
shape this work follows rather than changes.

## Context

The Tree View could add and remove concepts, and nothing else. Re-parenting a term meant opening
the concept document and hand-editing its `broader` array — the one operation the tree exists to
make legible, done somewhere else.

Hierarchy editing adds moving (by command and by drag), promotion and demotion between a scheme's
`topConcepts[]` and `concepts[]`, filing an existing concept into a scheme, publication markers on
every row, and support for doing all of it inside a Content Release.

Two facts shaped every decision below.

**Patching a `skosConcept` is new surface.** Every pre-existing plan patched the *scheme*.
`planCreateConcept` wrote `broader` once at creation and nothing ever modified it. Moving a concept
and filing one as a child both write to a concept document, which the plugin had never done.

**We never hold a whole document.** The tree query projects `{id, _originalId, prefLabel, level,
…}`; the insert picker projects less. So `createIfNotExists` — the trick every scheme mutation
used — has nothing to create from on the concept side.

## Decision

### Mutate through the Actions API, not `client.transaction()`

Every concept mutation is dispatched as document actions.
`sanity.action.document.edit` creates the draft, or the release version, **from the published
document** and applies the patch in one call. That solves the missing-document problem outright:
the seam supplies a patch and an id, and the server supplies the content.

It also turned out to be a correctness requirement rather than a convenience. The scheme
mutations originally ran
`client.transaction().createIfNotExists({...displayed, _id: targetId}).patch(targetId, …)`, seeding
the target from `displayed` — the document the form holds. In the drafts perspective that is the
draft, and seeding from it is right. **Under a release perspective it is still the draft**, while
the Tree View queries with `perspective: [release]`, which layers over *published* and never shows
drafts.

Observed on the dev dataset: the `Subjects` scheme had 5 published members and 7 in its draft.
Adding a single concept inside a release wrote a version carrying **8** — the draft's 7 plus the
new one — while the editor was looking at 5. Two unpublished draft members joined the release
without being asked for, and publishing the release would have published them. Seeding server-side
from published makes the version match what is on screen.

So there is one path for everything, and `createIfNotExists` is gone:

| mutation | actions |
|---|---|
| create | `document.create` (the concept) + `document.edit` (the scheme), atomically |
| remove / promote / demote / insert at root | one `document.edit` on the scheme |
| move | one `document.edit` on the concept |
| insert as a child | two `document.edit`s, atomically |

An action array is applied atomically, which is what the two-document mutations need: a scheme
member with no broader term renders at the root as an orphan, and a broader term on a non-member
renders nowhere. Either edit alone leaves the scheme wrong.

### Releases: what is actually true, as opposed to derivable

The id math made it *look* as though scheme-only mutations were release-aware and concept
mutations could not be. Both halves of that were checked against a real release on the dev
dataset before any of this was built, and the plan changed twice as a result. Recording the
findings, because every one of them is cheap to get wrong by reasoning:

- **`_originalId` reports `versions.<release>.<id>`** under a release perspective when a version
  exists, and the published id when it does not — the exact parallel of `drafts.<id>`.
- **`displayed._id` is already the version id** before any version document exists. Studio sets it
  from the selected perspective, independently of which snapshot supplies the *content*. So
  `deriveSchemeMutationTarget` needs nothing but that id. Reading Studio's bundled source suggests
  otherwise — the form value falls back `version || draft || published` — and that reading is
  wrong. **The bundles are not evidence; the dataset is.**
- **`document.edit` reaches a release version** through `versionId` in place of `draftId`, and
  creates it from the published document when it does not exist. This is documented, under *Create
  a draft/version document with edits*. It means move and child-insert needed correct ids, not a
  new mutation path.
- **`sanity.action.document.version.create` is therefore never needed — and must not be used
  blindly.** It is **not idempotent**: a second call returns 409 `documentAlreadyExistsError`. An
  action array is atomic, so `[version.create, edit]` fails outright the second time a concept is
  touched in one release.
- **`client.action()` cannot express a version edit.** `@sanity/client@7.27.0` types `EditAction`
  with `draftId` only. Dispatch goes through
  `client.request({uri: '/data/actions/<dataset>'})` — the workaround Sanity's own Actions API
  guide gives for this gap. Revisit when the client types `versionId`.

### Drag state lives outside the port, and the gesture is not the tested unit

`ConceptDragContext` owns the gesture and nothing else: what a drop *means* is `canMoveConcept`
in [`core/tree/moveConcept.ts`](../../../src/core/tree/moveConcept.ts), and carrying it out is
`useConceptDrop`. Both the `Move to…` command
and the drag produce the same `planMoveConcept`, which is why the command shipped first — it made
the drag presentational and the keyboard path free.

jsdom implements no layout engine, so `pointerWithin` can never match and the gesture itself
cannot be asserted. Per ADR 0001 the asserted unit is **the plan that reaches the port**, never the
gesture. Where a drag-related invariant must be pinned, pin the mechanism rather than the
interaction — see the registry test described below.

### `@dnd-kit/core` as a runtime dependency

This is the plugin's fifth runtime dependency, which cuts against
[#99](https://github.com/andybywire/sanity-plugin-taxonomy-manager/issues/99). Two things make it
acceptable, and the second is the one that matters:

- `sanity` itself depends on `@dnd-kit/core@6.3.1`, so consumers already have it.
- **Unlike the `@sanity/ui` duplicate-instance trap of [ADR 0004](0004-sanity-ui-v4.md), a second
  copy here is harmless.** We create our own `DndContext` inside our own subtree and never rely on
  one Studio provides, so two instances cannot cross-talk. `scripts/test-studio-install.mjs`
  therefore does not assert a single copy of it, and should not be extended to.

### The insert picker is ours, not Studio's

Every Studio search export is `@internal`: `ReferenceAutocomplete`, `SearchProvider`,
`SearchDialog`, `createSearch`, `ReferenceInputOptionsProvider`. The picker is built on
`Autocomplete` from `@sanity/ui/autocomplete` — a stable subpath under the ADR 0004 rule — driven
by our own debounced GROQ.

The cost of going our own way is near zero, because a custom query is required either way:
"concepts not already in this scheme" is not expressible through Studio's search, which also ranks
across every document type. What we reproduce is the look and the typeahead behavior; what we
decline is the coupling.

Three things it needed that were not obvious: an empty query lists what is available rather than
nothing; options must be rendered as buttons or they neither highlight nor take a pointer cursor;
and `openOnFocus` has to stay off, or a dismissing click inside the dialog reopens the list.

## The trap this plugin keeps falling into

Four independent instances now, and they are one thing:

1. **[ADR 0004](0004-sanity-ui-v4.md)** — `@sanity/ui` v4 moved components off the root entry, and
   two copies meant two React contexts.
2. **The insert picker** — every Studio search export is `@internal`.
3. **Publication markers** — `resolveDocumentStatusIcons` and `DocumentVersionsStatusIndicator` are
   both `@internal`, and the icons they draw with sit in Studio's `temporary-icons/`, marked for
   deletion. Reproduced rather than imported.
4. **[#126](https://github.com/andybywire/sanity-plugin-taxonomy-manager/issues/126)** — a
   third-party registry whose halves are not symmetric. `@dnd-kit/core` registers a droppable by
   overwriting whatever holds that id, unregisters by deleting when the keys match, and keys the
   effect that does both on the id alone. Two trees in one `DndContext` sharing ids meant the
   `Move to…` dialog evicted the structure tree's drop targets and deleted them on close, leaving
   the tree undraggable until reload.

**The rule.** This plugin spans a `sanity` peer range and proves it with `pnpm
test:studio-install`. Reproduce behavior rather than importing internals — and where a third-party
API is unavoidable, read its source for asymmetries rather than assuming they are symmetric.

**What makes this class expensive is that no build step sees it.** `pnpm test`, `pnpm typecheck`,
`pnpm build` and `pnpm --filter studio build` all passed with every one of the four present. Three
were caught by a human using the Studio; the fourth by a dry-run consumer install. Where a bug of
this class is fixed, pin the *mechanism* in a test even when the interaction cannot be driven —
#126's test reads `useDndContext().droppableContainers.getEnabled()` across the dialog opening and
closing, and comes back empty without the fix.

## Consequences

- The plugin now writes to `skosConcept` documents, not only to schemes. Any future mutation
  should join the one Actions path in `core/mutations.ts` — add a plan kind and a branch in
  `conceptPlanEdits`, and the adapter needs no change at all.
- `conceptPlanEdits` is the whole of the seam's mutation logic, so every mutation stays testable as
  plain input→output. The adapter maps an edit onto an action and posts the array.
- Hierarchy editing works in a Content Release, which is the plugin's **bulk path**: there is
  deliberately no bulk-publish document action, because Content Releases already are that feature
  (and building one would have needed `@beta` Studio APIs for work Studio ships). An editor stages
  a restructure in a release and publishes it at once.
- **Publication markers stay off in a release.** A draft is not the comparable thing inside one —
  the release version is. Making them release-aware is a different question: "does this concept
  have a version in *this* release".
- Claims about Studio or Content Lake behavior in this plugin should be **observed before they are
  relied on**. Every release-related claim in the original plan was derived from id math, and most
  of them were wrong in one direction or the other.
