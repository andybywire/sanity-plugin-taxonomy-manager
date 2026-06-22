# Development docs

Design rationale and decision records for `sanity-plugin-taxonomy-manager`, for contributors and
AI-assisted development. Start with [CLAUDE.md](../../CLAUDE.md) (the "how we work here" summary); this
directory holds the deeper *why*. User-facing docs are the rest of [`docs/`](../) (the Docsify site at
[sanitytaxonomymanager.com](https://sanitytaxonomymanager.com)); these development docs live alongside it
but are kept out of the site navigation (`_navbar.md`).

## Decision records

Architecture Decision Records — one per major architectural axis. Each captures the context, the decision
(with alternatives weighed), and the consequences.

- [0001 — Pure core behind a data-port seam](decisions/0001-pure-core-data-port.md)
- [0002 — Semantic recommendations via `text::semanticSimilarity`](decisions/0002-semantic-recommendations.md)
- [0003 — 5.0.0 platform modernization](decisions/0003-5.0.0-platform-modernization.md)
