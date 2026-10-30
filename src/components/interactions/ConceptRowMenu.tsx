import {ArrowRightIcon} from '@sanity/icons/ArrowRight'
import {EllipsisVerticalIcon} from '@sanity/icons/EllipsisVertical'
import {Button} from '@sanity/ui'
import {Menu, MenuButton, MenuItem} from '@sanity/ui/menu'

/**
 * #### Concept Row Menu
 * The overflow menu on a hierarchy row. It carries the commands that act on the
 * concept's *place* in the tree, as opposed to the inline add and remove
 * buttons beside it, which act on its membership in the scheme.
 *
 * It ships with one command and is shaped to take more: promoting a concept to
 * a top concept, and demoting one, are the next two, and both belong here
 * rather than as another icon in the row.
 */
export function ConceptRowMenu({
  conceptId,
  label,
  onMove,
}: {
  conceptId: string
  label: string
  onMove: () => void
}) {
  return (
    <MenuButton
      id={`concept-row-menu-${conceptId}`}
      button={
        <Button
          icon={EllipsisVerticalIcon}
          mode="bleed"
          aria-label={`More actions for ${label}`}
          paddingY={2}
        />
      }
      menu={
        <Menu>
          <MenuItem icon={ArrowRightIcon} text="Move to…" onClick={onMove} />
        </Menu>
      }
      popover={{portal: true, placement: 'bottom-end'}}
    />
  )
}
