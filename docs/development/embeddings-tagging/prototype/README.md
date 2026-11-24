# Prototype: the site's tagger, for reference

Copied unchanged from `andybywire/andyfitzgeraldconsulting` at commit `81173a6`: five files from
`studio/tagger/` and `studio/schemas/objects/topicScore.ts`. They ran in the site's lab Studio
only and never reached production.

That commit was the tip of the site's `recommendations-research` branch, which was deleted on
2026-11-24 and kept as the annotated tag **`archive/recommendations-research`**. Check it out there
for what isn't copied here: how the prototype was wired into the lab Studio (the `topicScores`
field on four document types, its validation, and the "Suggest topics" action in
`sanity.config.ts`), and the research's 29 commits.

**They are reference, not code.** They import the site's Studio and schema, which this repo
doesn't have, so nothing here is built or type-checked: `tsconfig.json` covers `src/` only.
eslint would pass them, since it doesn't resolve imports, but `TopicsInput.tsx` carries a
react-hooks warning, so `docs/**` is in the eslint ignores rather than add noise to this repo's
lint output. Prettier skips the folder too (`.prettierignore`), so they stay byte-identical to the
commit above. Port what's useful
into `src/core/` behind the data port, with tests, rather than importing from here.

| File | What it does |
|---|---|
| `tagger.ts` | The pure tagger: the anchored scale, bands, specificity, minimum, author tags. `tagCorpus` is what `../evidence/` was made with |
| `score.ts` | The concepts, their query text, and one document scored forward |
| `propose.ts` | The merge into `topic`, and `exclusionPatches`, the rules for author tags and exclusions |
| `SuggestTopicsAction.tsx` | "Suggest topics": confirm the cost, score, review, apply to the draft |
| `TopicsInput.tsx` | Records a removal as an exclusion as it lands |
| `topicScore.ts` | The `topicScores` field the site stored scores in. The design in `../README.md` moves scores off users' document types, so this is the shape not to repeat |

What each taught is in `../README.md` → "The prototype, and what it taught".
