> **Archived copy.** From `andybywire/andyfitzgeraldconsulting`,
> `docs/recommendations-research/value-add.md`, at commit `ae73f98` (2026-11-24). Paths and links in it refer to
> that repository, where the whole research folder stays in git history at that commit.

# Value add: taxonomy-based recommendations next to embeddings

*Living document. It feeds the "Why" section of the eventual article(s).*

The framing is **what you get by using a taxonomy**, not "why taxonomy is better." Embeddings will
win some cases, and this doc records those too.

**What is really being compared** (2026-10-26). In this project the taxonomy's tags come from
embeddings too: the tagger scores every document against every concept. So the contest is not
"embeddings against a taxonomy". It is **direct similarity against similarity routed through a
vocabulary**. Whatever the vocabulary adds on the way is the taxonomy's value:

- the choice of what counts
- the hierarchy
- the category rules
- the governance

That is also why the baseline runs under the taxonomy's own category rules as well as
unrestricted: the category rules belong to the comparison, not to the vocabulary.

Each claim below carries four things:

- the claim itself
- what we know now, measured or argued
- what would show it, or show it wrong
- its status: **argued**, **measured**, **supported** or **refuted**

---

## 1. Precision about the domain

**Claim.** A taxonomy sets the terms of which relationships count. By naming what matters in a domain,
and leaving out what doesn't, you decide which connections are favored.

**What we know.**

- **An embedding mixes everything.** It is one vector per document, blending topic, form, register
  and vocabulary. Embeddings cannot leave out what doesn't matter, because they don't know what
  matters. That is the behavior Andy saw in M3: conference recaps find other conference recaps, and
  topically related pieces deeper in the archive are missed.
  - **Measured on insight pages:** 62% of embedding picks share the page's genre, against 45% of
    the taxonomy's picks.
- **A taxonomy is precise only about what it has been told.** In M3, many embedding matches beat the
  taxonomy's. Two likely causes:
  - **under-tagged older content.** Documents from 2013–2022 average 2.0–2.8 tags; those from 2023
    on average 3.1–4.0. 14 concepts were created in August–September 2026.
  - **gaps in the vocabulary**
- **None of the 73 concepts uses `skos:related`.** Two documents in different top branches can relate
  only through a tag they share, so the hierarchy cannot connect them.

- **The same blurring shows up when embeddings are used to tag.** In the score spike, broad
  concepts were hubs: *Information Architecture*'s definition put it in 23 documents' top 4,
  though it is hand-tagged on 6. Similarity to a broad definition is not aboutness. The
  hierarchy and the specificity rule are what keep it from taking over.

**What would show it.** After revisions 1–3 and retagging, the taxonomy columns win the cases that
embeddings won in M3. Topical matches deep in the archive appear without the form-matching noise.

**Status: argued.** Tested by M3.1–M3.4.

## 2. Coordinating facets

**Claim.** A taxonomy can coordinate facets. Connections can cross facets (presentations and
insights), weighted toward resources that really match, and the approach extends past two facets.

**What we know: can embeddings do this?**

- **What they can do.** Filtering by facet is easy: any GROQ filter runs before `score()`. Ranking
  several facets together is fine too, because scores *within one query* can be compared.
- **What they can't do is express a rule for crossing facets.** "Cross only when the match is really
  strong" needs a threshold.
  - **The score doesn't support one.** Sanity's `_score` is opaque, unitless and cannot be compared
    across queries.
  - **The scale can move.** Sanity may update the model and recompute without notice, so any
    threshold sits on a scale nobody controls.
- **They have no facets of their own.** A dataset has one embedding projection, so you can't ask
  for "similar in topic, regardless of form."
- **A hybrid in GROQ is possible.** `score()` accepts `boost()` on any predicate; we verified
  `boost(_type == "presentation", 3)`. But the weights are arbitrary and sit on an opaque scale,
  which is the 2025 "nudges" problem again.
- **The taxonomy version is a rule you can state.** For example: "a presentation enters an insight's
  list only on a shared tag, and only by outranking the weakest insight card."

**What would show it.** The cross-category ranker (plan → phase 1) surfaces strong cross matches
without crowding out home-category ones. Compare it with unrestricted embeddings, which crossed
branches on 29 of 44 insight pages in M3.

**Status: argued.** The limits of embeddings are measured and documented; the taxonomy rule is not
built yet.

## 3. Governance at the level of the system

**Claim.** Authors describe a resource with tags, ideally with help from embeddings. The taxonomy
manages how those tags relate to each other. When priorities change, or topics are added or
collapsed, content needn't change to take on the new understanding.

**What we know.**

- **The mechanism already runs on this site.** Publishing a `skosConcept` or `skosConceptScheme`
  re-ranks every page.
- **Restructuring needs no content edits:** move a concept, add a broader concept, or add
  `related`.
- **Collapsing two concepts does touch content,** because documents still reference the retired
  one. The way around that is to demote rather than delete: make the retired concept narrower than
  the one replacing it, and the "nearer" tier keeps its connections.
- **With embeddings, the relationships live elsewhere:** in the model, the projection and the query
  text. Their only governance levers are re-projecting and rewriting content.

**What would show it.** A governance simulation: edit the taxonomy in a copy, and show the lists move
with zero content edits.

**Status: argued.** The mechanism is shipped; the simulation is not run.

## 4. Interoperability

**Claim.** A SKOS-compliant taxonomy can be used across systems more easily than embeddings can.

**What we know.**

- **What the plugin provides:** a stable RDF URI for every concept and scheme (base URI plus ID).
- **What it doesn't:** a SKOS export, or mapping properties such as `exactMatch` and `closeMatch`.
- **Vectors don't travel.** They are tied to one model, and two models' vectors can't be compared.
- **The site doesn't carry concept URIs.** Its JSON-LD gives topics as plain strings, because
  concepts aren't addressable here. So the claim is about the *vocabulary*, not the site's markup.

**What would show it.** No experiment is planned; this stays a paragraph, in scope only.

**Status: argued.**

## 5. Cost

**Claim.** Using a model to *describe* a resource is a worthwhile one-time spend. Calculating
relationships on every build or request is a recurring spend for answers that rarely change.

**What we know.**

- **How Sanity charges.** Generating embeddings is free on every plan. Semantic queries count against
  a monthly quota, with overage beyond it.
- **Whose input is the query decides the case.**
  - **Related content** starts from a document that already exists, so it can be worked out ahead.
  - **Search** starts from whatever a visitor types, so semantic queries earn their per-query cost
    there.
  - **The position is not "avoid the metered feature."** It is to spend queries where the input is
    unknown, and once where it isn't. That also bridges to the search article.
- **Placement matters more than static versus dynamic:**

  | Placement | Cost |
  |---|---|
  | Per request | every page view |
  | Per build | 73 queries on every publish, because each publish rebuilds the whole site |
  | Per publish of one document, stored | goes stale as new documents arrive |
  | Per act of tagging | once per document, buying durable metadata that a person reviews |

**What would show it.** A cost model: builds per month, from the deploy history, times pages, for
each placement.

**Status: argued.**

---

## Where embeddings win

Recorded so the article stays honest.

- **Many M3 cases** (Andy, 2026-10-21). The specific ones go into the M3.0 evaluation.
- **Untagged documents.** Two presentations have no tags; the taxonomy can show them only "Recent",
  while embeddings return plausible lists. Embeddings also *tag* them well. In the score spike,
  *Knowledge Graphs and IA*'s top three concepts were Knowledge Graphs, Information Architecture
  and Linked Data: a case for embeddings proposing tags rather than replacing them.
- **The same work in two forms.** For example, the *Boutique Knowledge Graphs* talk and its article.
  Embeddings find these across categories. The cross-category rule may close this gap.
  - **Measured in the baseline** (2026-10-27): these pairs are embeddings' *strongest* crossings,
    at 0.78–0.98 on the anchored scale. Others are *Conversations with Robots*, *Domain Modeling*
    and *Deskilling*.
  - **A taxonomy finds such a pair only if both versions carry the same tags.** Embeddings find
    it from the words alone.
  - **Measured on the hand tags** (cross-category dry run, 2026-10-27), the two versions often
    don't carry the same tags. The *Conversations With Robots* talk crosses to *Flying Cars*,
    not to its own article. That's a tagging-consistency gap, which the tagger may close: both
    versions score against the same concepts.
  - **There's a modeling alternative to either:** say outright that two documents are one work,
    with a reference between them. That's a content-model question, so it's Andy's.

## Combinations worth testing

- **Embeddings propose, the taxonomy decides.** Embeddings suggest tags to a person, which is the
  plugin's recommendations feature and this project's tagger. Ranking then runs on the tags.
- **The taxonomy decides membership and tier; embeddings order cards within a tier** in place of
  date, and fill the fallback in place of "Recent". Opacity doesn't matter for ordering within one
  query.

## Other factors to weigh

Add as they come up.

- **Explainability.** Every taxonomy card has a reason you can state.
- **Stability.** Results don't move unless the vocabulary or the tags do.
- **Cold start.** A new document with an unusual tag gets nothing from the taxonomy until it is
  tagged well.
- **Small categories.** The note pool of six produced the one insight fallback.
- **Maintenance cost.** A taxonomy needs an owner, while embeddings need none, but also take no
  direction.
- **A hierarchy helps only the consumers that infer from it.** Here the ranker infers: its "nearer"
  tier matches a child against its parent. The facet browse doesn't: it filters on direct tags
  only.
  - **The cost of that gap, measured 2026-10-26:** the *Content Strategy* chip lists 0 documents
    while 26 are tagged with one of its children.
  - **What the same structure does in each consumer:** it strengthens one and leaves the other
    thin. So where the inference happens is a design choice, not a property of the taxonomy.
