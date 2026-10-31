import {ArrowDownIcon} from '@sanity/icons/ArrowDown'
import {ArrowRightIcon} from '@sanity/icons/ArrowRight'
import {ArrowUpIcon} from '@sanity/icons/ArrowUp'
import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {RemoveCircleIcon} from '@sanity/icons/RemoveCircle'
import {Button} from '@sanity/ui'
import {Menu, MenuButton, MenuItem} from '@sanity/ui/menu'

/**
 * #### Concept Row Menu
 * The overflow menu on a hierarchy row, and the home for everything that acts
 * on the concept's place in the scheme.
 *
 * Removing a concept lives here rather than on the row, where a destructive
 * action sat one stray click from the surface. Moving, promoting and demoting
 * live here too. Every row has this menu, so the row's visible controls stay
 * the same shape whatever kind of concept it is.
 *
 * Items carry no tooltip. Studio puts one on a menu item only to say why that
 * item is *disabled* (`TooltipOfDisabled`); an enabled item's label is already
 * its explanation, and a tooltip inside an open menu would cover its
 * neighbours.
 */
export function ConceptRowMenu({
  conceptId,
  label,
  onMove,
  onPromote,
  onDemote,
  onRemove,
}: {
  conceptId: string
  label: string
  /** Omitted for a concept that cannot move — a top concept, for now. */
  onMove?: () => void
  /** Offered on an orphan alone: a concept with a broader term in this scheme
   * would render twice at once, at the root and under its parent. */
  onPromote?: () => void
  /** Offered on a top concept alone — the only thing there is to demote. */
  onDemote?: () => void
  onRemove: () => void
}) {
  return (
    <MenuButton
      id={`concept-row-menu-${conceptId}`}
      button={
        <Button
          icon={EllipsisHorizontalIcon}
          mode="bleed"
          aria-label={`More actions for ${label}`}
        />
      }
      menu={
        <Menu>
          {/* Promotion first: it is the larger change of the two a concept at
              the root can make, and it reads oddly below a move it outranks. */}
          {onPromote && (
            <MenuItem icon={ArrowUpIcon} text="Promote to Top Concept" onClick={onPromote} />
          )}
          {onMove && <MenuItem icon={ArrowRightIcon} text="Move to…" onClick={onMove} />}
          {onDemote && (
            <MenuItem icon={ArrowDownIcon} text="Demote to Concept" onClick={onDemote} />
          )}
          <MenuItem
            icon={RemoveCircleIcon}
            text="Remove from scheme"
            tone="critical"
            onClick={onRemove}
          />
        </Menu>
      }
      popover={{portal: true, placement: 'bottom-end'}}
    />
  )
}
