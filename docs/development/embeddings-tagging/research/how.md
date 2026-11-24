> **Archived copy.** From `andybywire/andyfitzgeraldconsulting`,
> `docs/recommendations-research/how.md`, at commit `ae73f98` (2026-11-24). Paths and links in it refer to
> that repository, where the whole research folder stays in git history at that commit.

# How: steps for building taxonomy-based recommendations

*Living document. It records the steps a reader should take, written down as we discover them. It
keeps what worked, and notes what didn't once we find out. It feeds the "How" section of the
article(s) and the Taxonomy Manager starter prompt.*

Each step is marked **working**, **didn't work** or **untested**.

## The steps so far

### Audit the vocabulary before anything else

**Working.** Before ranking anything, find out what the vocabulary and the tagging can support. Each
check is a GROQ query, and each failure says something about the vocabulary, not the code:

- documents tagged at a top concept (here: 0)
- concepts with more than one parent (here: 0; the ranker reads only the first `broader`)
- untagged documents (here: 2 presentations)
- concepts with a definition, scope note or example (here: 73 of 73, 51 and 45). These become the
  tagger's input.
- tags per document by year (here: 2.0–2.8 for 2013–2022, against 3.1–4.0 from 2023). A decline
  for older years points to under-tagged older content.
- use of `skos:related` (here: none)

### Measure what you have before changing it

**Working.**

- Fetch a fresh corpus every time, because content moves between sessions.
- Compute the current lists with the site's *own* ranker, not a reimplementation. The scripts here
  import `web/src/lib/related.ts` directly.
- When a script copies logic, add a guard that checks the copy reproduces the real ranker on every
  page before reporting anything.

### Don't worry about Dice versus Jaccard

**Measured.** They produced the same ranking on 73 of 73 pages. With lexicographic tiers they always
will: Dice is a monotone transform of Jaccard, and among tied candidates the two denominators differ
by the same factor. The choice matters only if you add weights or nudges, which is a reason not to.

### Enable dataset embeddings with a projection per type

**Working, after a correction.**

- Write the projection from the *schema*, type by type.
- Probe one query and read `_embeddings[].fields` to confirm the body text was embedded, before
  spending a query on every page.
- Include `skosConcept` if you want the plugin's tag recommendations.
- Leave out long, uneven fields such as transcripts. They dominate the embedding, and Sanity drops
  everything past 10 chunks.

The projection used here:

```groq
{
  _type == "article" => {title, shortDescription, bodyText},
  _type == "note" => {title, shortDescription, bodyText},
  _type == "caseStudy" => {title, shortDescription, atGlance, whatDid, projectGoal, projectApproach, projectOutcome},
  _type == "presentation" => {title, description, bodyText, highlights},
  _type == "skosConcept" => {prefLabel, definition, scopeNote, example}
}
```

### Compare against embeddings honestly

**Working, with one caveat.**

- **There is no document-to-document similarity in GROQ.** `text::semanticSimilarity()` scores a
  query *string*, so "related to X" means "similar to X's title and summary."
- **The caveat:** a document with no summary queries on its title alone.
- **Never compare `_score` across queries.**
- **Cache the embeddings results.** They depend only on content text, so they don't change between
  taxonomy revisions.

### Experiment in a lab dataset, not the live one

**Working.** Retagging and restructuring a taxonomy rewrite exactly the fields a live site builds
from: related lists, topic chips, facet URLs, feeds and search. A copy of the dataset keeps the live
site publishing while the experiments run.

- **Check the webhooks first.** Sanity's `sanity hook list` shows which dataset each one fires on.
  Here the only webhook is scoped to `production-26`, so writes to the lab trigger no deploy.
- **The Free plan has no cloud copy.** `sanity datasets copy` fails with "advanced dataset
  management". Export and import does the same job.
- **Copy the assets too,** even though the experiment never shows an image (see What didn't work).
- **Point a local Studio at the lab without changing the deployed one.** Here that's an env var
  that only a `dev:lab` script sets, plus a "LAB" title, so the two are never confused.

### Back up the tags, and prove the restore, before any bulk write

**Working.** An auto-tagger rewrites a field on every document at once. So the way back has to
exist, and be shown to work, before the tagger does.

- **Back up exactly what the tagger writes,** and nothing else: here, `topic` and the score field.
  Keep the array `_key`s, so a restore is exact, not merely equivalent.
- **Restore absence too.** A field the backup didn't have is removed. That is how a restore undoes
  a score field the tagger added later.
- **Make the restore a dry run unless told otherwise.** It should print what would change in human
  terms, using concept labels rather than IDs.
- **Test it on one document,** changed the way the tagger will change it. Run a dry run that
  should flag that one document alone, then a write, then a full dry run that should report
  nothing.
- **Use the CLI's login rather than a token.** `sanity exec --with-user-token` passes the
  script your login token in an environment variable, so there's no token for you or an LLM to
  paste anywhere.
- **Make the live dataset hard to write to by accident.** Here a script refuses to write to
  `production-26` unless `--allow-production` is on the command line.

### Measure the score scale before setting a threshold

**Working.** Sanity's semantic `_score` has no stated scale, and its docs say not to compare
scores across queries. A tagger has to do exactly that: compare one document's score under
concept A against its score under concept B. So measure before choosing a threshold.

- **Score every document against every concept once and save the matrix.** Run the analysis from
  the saved file, so trying another normalization costs no quota.
- **Put the concept's own document in each query.** It is embedded from the same text, so it is
  the best match a query can have, and the yardstick for the others.
- **Judge each normalization against the tags you already have**, even incomplete ones. Use
  separation across all pairs (AUC), and how many of each document's tags land in its top few.
- **Reject any normalization that depends on the rest of the corpus,** such as min-max, z-scores
  or percentiles. Each new document would move every concept's scale, so stored scores would go
  stale.
- *Found here:* raw scores were nearly comparable already, and no corpus-independent
  normalization beat them. The scale was chosen for readability. Note too that a score's floor is
  far from zero, so a "0.8" on a naive ratio means much less than it sounds.
- *Also found:* thin documents, meaning short notes and presentations with little text, score low
  against everything. A threshold leaves them untagged unless a rule says otherwise.

### Find out how much of a query is read

**Measured.** "Find documents like this one" has to be a semantic *search* with this document's
text, so how much of that text the search reads matters.

- **Measure it.** Send progressively longer openings of one long document, and watch its score
  against itself.
- **Repeat an identical query to learn the noise** before reading anything into small changes.
  Here identical queries varied by up to 0.003.
- *Found here:* Sanity read about the first 2,000–2,500 characters. Longer queries raised no error
  and changed nothing beyond the noise. Document-side chunks, by contrast, run to about 5,000
  characters.
- *So:* cap the query at what is read (here 2,500 characters: title, summary, then the body), and
  say so. A longer query only hides the limit.

### Turn scores into tags: slots, bars and a specificity rule

**Working.** The first tag set, v0, was simulated on 2026-10-28.

- **Fill slots in score order, with a bar for each slot.** Here, three slots need 0.45 and three
  more need 0.54, so a document earns extra tags only by matching more strongly. Author tags take
  slots first and are never bumped.
- **Set a policy for a concept and its broader concept before auto-tagging.** Here the two never
  sit together, and the more specific one wins. A model scores a parent and its child high
  together, so without a rule the pair fills two slots with one idea. The parent isn't lost: a
  ranker can infer it, as this one's "nearer" tier does.
- **Then say what "both qualify" means.** Here both had to earn a slot on score. The looser
  reading, where any narrower concept that clears the bar evicts its broader, changed 12 of 73
  documents, often for the worse. It took *Information Architecture* off *What's It Like to Work
  with an Information Architect?*.
- **Give every document at least one tag, and keep its score with it.** Four of 73 landed there,
  all below the bar, and the stored score says so.
- **Keep the tagger pure and its output a file.** It reads a cached score matrix and writes a tag
  set, so a run costs no quota and touches no dataset.
- *Found here:* the tags don't look like the hand tags. 90 of 207 hand tags came back, and the hubs
  moved: *Content Analysis* landed on 21 documents (5 by hand) and *Search* on 11 (none by hand).
  Whether that is better is a question for the evaluation, not for the tag counts.

### Still to work out

Each is **untested**:

- **Evaluate without writing.** A ranker that is a pure function can run over *simulated* tags:
  the tagger produces a tag set per version as a file, and the comparison reads it in memory. Tags
  only need to reach the dataset when a person has to see or edit them, at the audit, and at
  promotion. It took a direct question from Andy to see that writing wasn't needed.
- **Make the embeddings-only baseline fair** before comparing anything against it.
  - **Give it its best reasonable query:** title, summary and the opening of the body, not the
    title alone.
  - **Run it under the same category rules as the taxonomy,** as well as unrestricted, so the
    comparison measures the vocabulary rather than the category policy.
  - **Why it matters:** a weak baseline makes the taxonomy look better than it is.
- An incremental bump rule that never removes author tags, for a live site where content and
  concepts change one at a time.
- Rank across categories with a strong-match bar.
  - **Calibrate it on the tags you'll actually have.** With only 2–4 hand tags a document, a
    shared-tag ratio takes few values, and its bar jumped from 32 pages crossing to 2 between two
    adjacent settings.
  - **A ratio alone lets one shared tag between two thinly tagged documents count as strong.**
    A minimum count of shared tags guards against that.
- Revise the taxonomy: new terms, structure, examples, `related`.
- Run the evaluation loop (M3.n) and read the trends.

## What didn't work

- **Changing the site before the evaluation needed it** (2026-10-28). The detail pages were moved
  to the new cross-category ranker and verified on all 73 pages.
  - **Why it was wasted:** a simulated evaluation runs the ranker in memory, and nothing in it
    reads a page. Verifying the pages also meant building against the live dataset.
  - **What happened to it:** rolled back, and kept for promotion.
  - *Lesson:* keep the site out of the experiment until results are promoted. For each step, ask
    whether the evaluation needs it.
- **An asset-free copy of the dataset** (2026-10-22). The lab was first made with `--no-assets`, to
  avoid uploading 1.1 GB of images an experiment about text would never show.
  - **What it did:** it also removed every image **figure** from the body text of 17 of 73
    documents, and figures carry alt text and captions.
  - **What that broke:** embeddings read that text, so scores drifted between the copy and the
    original. *Purpose-Driven Taxonomy Design* went from 7.865 to 7.631, which reordered ranks 2–4
    of a probe query.
  - **Why the checks missed it:** M1/M2 matched exactly, because they read only tags, and a text
    diff over `pt::text()` passed, because that function skips figures.
  - **What caught it:** a probe run against both datasets, which *should* have matched.
  - *Lesson:* compare a copy the way the experiment will use it, on embeddings as well as tags.
- **A generic embeddings projection** (2026-10-21). The projection `{title, shortDescription, body}`
  was proposed from assumed field names.
  - **The mismatch:** no type here has `body`, and presentations have no `shortDescription`.
  - **What it would have done:** embedded titles and short descriptions only, which makes any
    comparison unfair.
  - **What caught it:** checking the schema before enabling.
  - *Lesson:* an LLM's draft configuration has to be checked against the real schema.

## Where an LLM speeds things up, and where people decide

| An LLM speeds up | A person decides |
|---|---|
| Reading the schema and queries to find the fields involved, then verifying them | Which list of recommendations is *better*: the benchmark |
| Writing measurement scripts, comparisons and evaluation docs | What the domain cares about: which concepts exist at all |
| Proposing candidate terms from the corpus (NLP) | Structuring a flat list of terms into a hierarchy |
| Drafting definitions, scope notes and examples | Accepting or editing those drafts |
| Scoring every document against every concept with embeddings | Setting thresholds, after seeing real score distributions |
| Flagging what changed between evaluation runs | Content-model choices: where scores live, what a category is |
| Re-tagging incrementally when a concept changes | Author tags, which are never overridden |
