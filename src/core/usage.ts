/**
 * #### Usage Scale
 * How a tagged-resource count becomes a bar length in the governance view.
 *
 * The bar encodes magnitude by length alone — one flat color, never a
 * darker-where-bigger ramp, which is an anti-pattern on nominal categories.
 * So the only arithmetic the view needs is "what share of the busiest term is
 * this one", and both halves of it live here rather than in the row.
 *
 * Pure: these read their arguments and return a number.
 */

/**
 * #### Usage Max
 * The largest count in the scheme — the value a full-length bar stands for.
 *
 * Taken over **every term the usage query answered for**, not over the rows
 * currently on screen. A scale derived from visible rows would rescale every
 * bar as branches were expanded and collapsed, so the same term would draw at
 * two different lengths in one sitting and the view would stop being readable
 * as a comparison.
 *
 * Returns 0 for a scheme where nothing is tagged, which `usageFraction` reads
 * as "no scale" rather than as a division by zero.
 */
export function usageMax(counts: ReadonlyMap<string, number>): number {
  let max = 0
  for (const count of counts.values()) {
    if (count > max) max = count
  }
  return max
}

/**
 * #### Usage Fraction
 * One term's share of the scheme maximum, as a number from 0 to 1.
 *
 * Zero is the governance story — an unused term is the thing a steward is
 * looking for — so it is returned honestly rather than nudged up to a visible
 * sliver. The design draws those rows as an empty track at full strength,
 * which is what makes a dead branch legible as a run of empty lanes.
 *
 * Guards rather than trusts its inputs: `max` is 0 for a wholly untagged
 * scheme, and a count can only exceed the max if the two were read from
 * different query results mid-update.
 */
export function usageFraction(count: number, max: number): number {
  if (max <= 0 || count <= 0) return 0
  if (count >= max) return 1
  return count / max
}
