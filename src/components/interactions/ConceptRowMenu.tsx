import {ArrowRightIcon} from '@sanity/icons/ArrowRight'
import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {TrashIcon} from '@sanity/icons/Trash'
import {Button} from '@sanity/ui'
import {Menu, MenuButton, MenuItem} from '@sanity/ui/menu'

/**
 * #### Concept Row Menu
 * The overflow menu on a hierarchy row, and the home for everything that acts
 * on the concept's place in the scheme.
 *
 * Removing a concept lives here rather than on the row, where a destructive
 * action sat one stray click from the surface. Moving lives here too, and
 * promoting a concept to a top concept — and demoting one — will join them.
 * Every row has this menu, so the row's visible controls stay the same shape
 * whatever kind of concept it is.
 */
export function ConceptRowMenu({
  conceptId,
  label,
  onMove,
  onRemove,
}: {
  conceptId: string
  label: string
  /** Omitted for a concept that cannot move — a top concept, for now. */
  onMove?: () => void
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
          {onMove && <MenuItem icon={ArrowRightIcon} text="Move to…" onClick={onMove} />}
          <MenuItem icon={TrashIcon} text="Remove from scheme" tone="critical" onClick={onRemove} />
        </Menu>
      }
      popover={{portal: true, placement: 'bottom-end'}}
    />
  )
}
