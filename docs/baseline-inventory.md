# Baseline behavior inventory (v4.7.2)

Captured at the start of the TDD rebuild as the **regression contract**: the facts every later
stage's "behavior unchanged" guarantee is checked against. Anything not listed under "Sanctioned
behavior changes" in the rebuild plan must remain byte-for-byte identical.

- **Version continuity:** current published version **4.7.2**; tag `v4.7.2` is confirmed an
  ancestor of `main` (next release computes upward from here, not from 1.0.0).
- **Captured from:** `src/index.ts`, `src/skosConcept.tsx`, `src/skosConceptScheme.tsx`,
  `src/types.tsx`, `src/structure.ts`, `src/hooks/useCreateConcept.tsx`,
  `src/hooks/useRemoveConcept.tsx`, `package.json`, `lib/`.

---

## 1. Public export surface (`src/index.ts`)

Exactly six named exports — the consumer contract. Renaming/removing any is breaking.

| Export | Kind | Notes |
|---|---|---|
| `taxonomyManager` | `definePlugin((options?: Options) => …)` | plugin name `'taxonomyManager'`; registers the two schema types + a `structureTool` |
| `TreeView` | React component | embeddable hierarchy view (also used by the structure tool) |
| `schemeFilter` | helper fn | reference-field `options.filter` factory; signature `schemeFilter({schemeId, expanded?, browseOnly?})` |
| `branchFilter` | helper fn | reference-field `options.filter` factory; signature `branchFilter({schemeId, branchId, expanded?, browseOnly?})` |
| `ReferenceHierarchyInput` | React input component | replaces the default single-reference input |
| `ArrayHierarchyInput` | React input component | replaces the default array-of-references input |

### Public config types (`src/types.tsx`)

- **`Options`** — plugin options: `baseUri?`, `customConceptFields?: FieldDefinition[]`,
  `customSchemeFields?: FieldDefinition[]`, `ident?: {pattern?, length?, prefix?, regenUi?}`.
- **`EmbeddingsIndexConfig`** — `{indexName: string; fieldReferences: string[]; maxResults?: number}`.
  ⚠️ Tied to the deprecated Embeddings Index API; **slated to change in Stage 5** (sanctioned).
- Other exported/used types: `ChildConceptTerm`, `TopConceptTerm`, `DocumentConcepts`,
  `SkosConceptReference`, `SkosConceptDocument`, `ConceptSchemeDocument`, `EmbeddingsResult`,
  `TreeViewProps`, `ConceptDetailLinkProps`, `PrefLabelValue`.

---

## 2. Schema types & fields (names are contract)

### `skosConcept` (`type: 'document'`, title "Concept", icon `AiOutlineTags`)
Factory `skosConcept(baseUri?, customConceptFields=[], ident?)`. Fields in order:
`prefLabel` (string, **required + custom uniqueness** validation), `definition` (text, 3 rows),
`example` (text, 3 rows), `scopeNote` (text, 3 rows), `altLabel` (array<string>, `Rule.unique()`),
`hiddenLabel` (array<string>, `Rule.unique()`), **`...baseIriField`** (→ `baseIri`),
`conceptId` (string, `initialValue: createId(ident)`, custom `Identifier` input, hidden/readOnly
once set unless `ident.regenUi`), `broader` (array<reference→skosConcept>, `options.filter:
conceptFilter`), `related` (array<reference→skosConcept>, same filter), **`...customConceptFields`**,
`historyNote`, `editorialNote`, `changeNote` (all text, 3 rows).
- `conceptFilter` excludes self + already-referenced broader/related:
  `!(_id in $broader || _id in $related || _id == $self)` with `$self = getPublishedId(document._id)`.
- `prefLabel` uniqueness: queries published-only (`!(_id in path("drafts.**") || …("versions.**"))`)
  on a `perspective: 'raw'` client; message `'Preferred Label must be unique.'`.
- `orderings`: `topConcept`, `prefLabel`. `preview`: title=`prefLabel`, media `AiOutlineTag`.
- `initialValue`: if `baseUri` set → `{baseIri, broader:[], related:[]}`; else fetch most-recent
  `baseIri` across either type. **`broader`/`related` initialized to `[]`** (load-bearing for the
  related/broader filter logic — must preserve).

### `skosConceptScheme` (`type: 'document'`, title "Concept Scheme", icon `NodeTree`)
Factory `skosConceptScheme(baseUri?, customSchemeFields=[], ident?)`. Fields in order:
`title` (string), `description` (text, 5 rows), **`controls`** (boolean, **deprecated**, readOnly,
hidden unless value present, `ManagementControls` input — legacy), **`...baseIriField`** (→ `baseIri`),
`schemeId` (string, `initialValue: createId(ident)`, `Identifier` input, hidden/readOnly once set
unless `ident.regenUi`), `topConcepts` (array<reference→skosConcept>, `Rule.unique()`,
`sortable:false`), `concepts` (array<reference→skosConcept>, `Rule.unique()`, `sortable:false`),
**`...customSchemeFields`**. `preview`: title=`title`, media `NodeTree`.

---

## 3. Structure tool & document views (`src/structure.ts`)

- `structureTool` name **`'taxonomy'`**, title **`'Taxonomy'`**, icon `NodeTree`.
- Root list "Taxonomy Manager" → items: "Concept Schemes" (`skosConceptScheme`), "Concepts" (`skosConcept`).
- `defaultDocumentNode` views per type:
  - `skosConceptScheme`: **Tree View** (`TreeView`, icon `NodeTree`) + Form view.
  - `skosConcept`: Form view + **"Tagged Resources"** (`ConceptUseView`, icon `DocumentsIcon`).
  - default: Form view only.

---

## 4. Mutation behavior (release/draft matrix)

Shared ID-derivation pattern used everywhere (preserve exactly; → `core/ids.ts` in Stage 3).
Given the displayed scheme `_id`:
- `isInRelease = isVersionId(displayed._id)`
- `releaseName = isInRelease ? getVersionNameFromId(displayed._id) : undefined`
- `schemeId   = isInRelease ? getVersionId(displayed._id, releaseName) : getDraftId(displayed._id)`

### `useCreateConcept(document)` → `createConcept(conceptType, concept?)` — apiVersion **2025-02-19**
- `newConceptId = isInRelease ? getVersionId(uuid(), releaseName) : getDraftId(uuid())`.
- New `skosConcept`: `{_id: newConceptId, _type, conceptId: createId(ident), prefLabel:'',
  baseIri: scheme.baseIri, broader:[], related:[]}`.
- If a broader concept was given: `broader=[{_key, _ref: getPublishedId(broaderId), _type:'reference',
  _weak: !isPublished, _strengthenOnPublish: isPublished ? undefined : {type:'skosConcept',
  template:{id:'skosConcept'}}}]` where `isPublished = isPublishedId(broaderOriginalId)`.
- Scheme-side reference: `{_ref: getPublishedId(newConceptId), _type:'reference', _key,
  _strengthenOnPublish:{type,template}, _weak:true}`.
- Transaction: `createIfNotExists({...displayed, _id: schemeId}).create(skosConcept)
  .patch(schemeId, setIfMissing({topConcepts|concepts:[]}).append(…, [ref])).commit({autoGenerateArrayKeys:true})`.
- On success: success toast + `openInNewPane(newConceptId)`. On error: error toast w/ message.

### `useRemoveConcept(document)` → `removeConcept(conceptId, conceptType, prefLabel?)` — apiVersion **2025-02-19**
- `type = conceptType=='topConcept' ? 'topConcepts' : 'concepts'`.
- Transaction: `createIfNotExists({...displayed, _id: schemeId}).patch(schemeId,
  unset(['${type}[_ref=="${conceptId}"]'])).commit()`.
- On success: `"<prefLabel>" removed from scheme` toast. On error: error toast.

> A third mutation site (add/remove reference) lives in `ArrayHierarchyInput.handleAction` and uses
> the same ID pattern; capture it precisely when extracting `core/ids.ts`/`core/mutations.ts` in Stage 3.

---

## 5. Build / packaging contract (`package.json` + `lib/`)

- `exports["."]`: `source → ./src/index.ts`, `import → ./lib/index.esm.mjs`,
  `require → ./lib/index.js`, `default → ./lib/index.esm.mjs`. Plus `./package.json`.
- `main: ./lib/index.js`, `module: ./lib/index.esm.js`, `types: ./lib/index.d.ts`.
  `files: [lib, sanity.json, src, v2-incompatible.js]`.
- Built `lib/` today: `index.js`, `index.esm.mjs`, `index.d.ts` **plus stray
  `index.esm.esm.js`, `index.esm.d.mts`** and no `index.esm.js` (the `module` field is stale).
  → cleaned up in the Stage 7 ESM-only `dist/` migration.
- Peers: `react >=18 <20 || ^19`, `react-dom` same, **`sanity ^4.0.0 || ^5.0.0-0`** (→ `^5 || ^6`
  in Stage 7). `engines.node >=20`. Build via `@sanity/plugin-kit` + `@sanity/pkg-utils`.

## 6. GROQ API versions in use (inconsistent — documented, not yet normalized)

| Site | apiVersion |
|---|---|
| `skosConcept`/`skosConceptScheme` `initialValue` baseIri fetch | `2021-03-25` |
| `skosConcept` `prefLabel` uniqueness (perspective `'raw'`) | `2025-06-10` |
| `useCreateConcept` / `useRemoveConcept` | `2025-02-19` |
| `schemeFilter` | `2025-02-19` |
| `branchFilter` | `2023-01-01` |

`2025-02-19` is the Content Releases version and **must be preserved** on the mutation/release
paths. Normalizing the rest is optional and behavior-neutral (decide during extraction).
