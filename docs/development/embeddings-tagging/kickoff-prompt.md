# Stream 3 kickoff: embeddings-assisted tagging in the Taxonomy Manager

You're starting stream 3: tagging assisted by Sanity's dataset embeddings, built into this plugin
at three levels: scheme, concept and resource. The work happens on the feature branch
`feat/embeddings-tagging`. Check you're on it before anything else.

## Read first, in this order

1. `CLAUDE.md`: how this repo works (pure core behind the data port, TDD, the gate, merge
   commits, the six public exports pinned by `src/index.test.ts`).
2. `docs/development/decisions/0001-pure-core-data-port.md` and `0002-semantic-recommendations.md`.
3. `docs/development/embeddings-tagging/README.md`: the starting document. It holds the goal, what
   the research established, the design to start from, the open questions, and how to validate.
4. `docs/development/embeddings-tagging/evidence/README.md` and `prototype/README.md`.
5. In `docs/development/embeddings-tagging/research/plan.md`: "Where things stand",
   "The reverse direction", and Specs → Tagger. Skim the rest only as a question needs it.
6. `docs/development/feature-backlog.md`, for where this sits among the other planned work.

## Ground rules

- **This plugin and my consulting site are separate projects.** Experiments and tests run in this
  repo's own dev Studio (`studio/`, project `zw90ihi2`, dataset `dev`). Never read from or write to
  the consulting site's datasets (`production-26`, `recommendations-lab`). If the dev dataset needs
  content to tag, propose how to create it or copy some in, and I'll decide. Whatever lands there
  becomes the dev Studio's own.
- **Semantic searches cost quota.** Each one is one read of the organization's `embeddings-reads`
  metric (1,000 a month on the Free plan, counted but not enforced in real time). Before any step
  that runs searches, say how many it will spend, and wait for my go-ahead.
- **Seams are mine to decide.** That covers the public API (any new export), where scores live and
  the shape of their records, what a field means, and where each level sits in the Studio. Surface
  each as a decision with a recommendation before building past it. Components, tests, queries and
  plumbing are yours to draft.
- **Reviewable pieces.** One coherent piece, then stop so I can look. TDD as this repo does it, and
  the gate (`pnpm test && pnpm typecheck && pnpm build && pnpm lint`) green before you call a piece
  done. Commit and push only when I ask.
- **The `evidence/` and `prototype/` folders are frozen copies.** Don't edit them; port from them.

## This first session: decisions, not code

Read the above, then come back with three things, and stop for my answers:

1. **The first piece, with its shape.** My expectation is the golden test: port the tagger's pure
   selection (the anchored scale, bands, specificity, minimum, author tags) into `src/core/`. Then
   test that, given `evidence/v5-matrix.json` and the config in `evidence/v5-tags.json`, it
   reproduces v5's tags exactly. No Studio, no network, no quota. Tell me if the code suggests a
   better first piece.
2. **The decisions that block later pieces,** each with your recommendation. At least:
   - where scores live (the starting document recommends a hidden, `liveEdit` record type per
     concept)
   - how the dev dataset gets a corpus, and whether its embeddings are enabled with a projection
     (the backlog says that's unconfirmed)
   - how this relates to the existing semantic recommendations
   - whether pieces land as PRs into `feat/embeddings-tagging` or as commits on it, and whether
     to open a GitHub issue for the stream, as this repo's issue-to-branch loop expects
3. **A short plan of pieces after the first,** in order, so I can see where it's heading. Keep it
   short: we'll revise it as we go.
