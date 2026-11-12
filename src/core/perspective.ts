import type {TaxonomyPerspective} from './ports'

/**
 * #### Perspective Option
 * A {@link TaxonomyPerspective} as the `perspective` option a Sanity query
 * takes: `'drafts'` for the default view, otherwise a single-layer stack
 * naming the selected release or `'published'`.
 *
 * Trivial, and deliberately named anyway. Every query this plugin runs has to
 * ask its question in the perspective the tree is rendering — ADR 0005 records
 * what it cost when the insert picker did not ([#128](https://github.com/andybywire/sanity-plugin-taxonomy-manager/issues/128)),
 * and the governance rollup and `views/ConceptUseView` answer the same
 * question at two scales, so a difference between them would show up as two
 * numbers that disagree. Writing the mapping once means a call site can get
 * the perspective wrong only by passing the wrong perspective, never by
 * spelling the mapping differently.
 *
 * Pure: reads its argument and returns the option.
 */
export function perspectiveOption(perspective: TaxonomyPerspective): 'drafts' | [string] {
  return perspective === undefined ? 'drafts' : [perspective]
}
