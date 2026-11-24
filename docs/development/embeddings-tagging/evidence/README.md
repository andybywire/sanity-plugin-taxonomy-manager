# Evidence: the v5 tag set and the matrix it came from

Copied unchanged from `andybywire/andyfitzgeraldconsulting` at commit `ae73f98`, from
`docs/recommendations-research/`. Kept here because they are the golden reference for this
stream: what the research's tagger produced, from exactly what input.

| File | Was | What it holds |
|---|---|---|
| `v5-matrix.json` | `scores/spike-recommendations-lab-combined-20261106T192359Z.json` | Every concept scored against every document of the site's lab dataset, 68 concepts × 73 documents, one forward semantic search per concept with the `combined` query recipe. Each concept carries its query text, first parent and `self`, the raw score of its own document in the same query, which the anchored scale divides by; each document score is Sanity's raw `_score`. Its own `base` and `rescored` fields record that Cognition was re-queried over an earlier matrix, which is not copied here |
| `v5-tags.json` | `tagsets/v5.json` | The tags selected from that matrix, with each tag's anchored score and the slot it filled, and the `config` that selected them: floor 4.9, bands 3 at ≥ 0.45 then 3 at ≥ 0.54, minimum one tag. Its `matrix` field names the file above by its old name |

## What they're for

**A golden test for the plugin's tagger.** `../prototype/tagger.ts` → `tagCorpus(matrix, config)`
turned the first file into the second. A tagger in this plugin's pure core, given the same
matrix and config, should reproduce v5's tags exactly. That proves a port faithful to what was
evaluated, and is plain input → output with no Studio and no network, which suits this repo's
TDD default.

**Not a calibration for any other dataset.** The floor and bands were measured on the site's lab
index, and even the site's production index, rebuilt from the same content, agrees with it only
at a rank correlation of 0.95–0.97. A new dataset calibrates from its own full matrix (see the
README's design, "Scheme").

Left behind in the site repository's history at `ae73f98`: the other score matrices, the
reverse-direction matrix and its blocks, tag sets v0–v4, and the M3 evaluation reports.
