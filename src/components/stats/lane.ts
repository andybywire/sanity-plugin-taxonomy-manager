/**
 * #### The Measure Lane
 * The two fixed widths the governance view's right-hand columns are built
 * from, declared once so the header label and the rows cannot drift apart.
 *
 * Both are read from the "Governance B.3" design rather than derived: a count
 * column of 40px and a bar track of 200px. Nothing in the `@sanity/ui` theme
 * implies either, so there is no token to take them from.
 *
 * Everything else about a row — its height, its gaps, its indent — is
 * deliberately **not** here. Those come from the same places the Tree View's
 * row gets them (`useControlWidth`, the theme's space scale, and the height
 * the content happens to make), because the two views are supposed to render
 * the same row and the surest way to do that is to not restate it. The row
 * height in particular is left to fall out of the content: the design file
 * records 35px as a *measured* value, and writing it down as a declaration is
 * how the earlier row-layout pass produced three numbers that were wrong.
 */

/** Width of the count column. Four tabular digits at the row's label size. */
export const COUNT_WIDTH = 40

/** Width of the bar track — the length a term with the scheme's top count fills. */
export const TRACK_WIDTH = 200

/** Height of the bar track and its fill. */
export const BAR_HEIGHT = 8

/** Corner radius of the bar track and its fill. */
export const BAR_RADIUS = 4
