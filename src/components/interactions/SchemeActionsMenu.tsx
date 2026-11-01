import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {InsertAboveIcon} from '@sanity/icons/InsertAbove'
import {Box, Button, Flex, Text} from '@sanity/ui'
import {Menu, MenuButton, MenuItem} from '@sanity/ui/menu'
import {Tooltip} from '@sanity/ui/tooltip'

/** The label every overflow menu in the tree answers to. */
export const MORE_ACTIONS_TOOLTIP = 'More concept actions'

/**
 * The menu's item labels, named here rather than written inline so that editing
 * the wording is a one-line change and nothing else has to follow it. Tests
 * identify the items by these, since both carry the same icon and have no other
 * stable handle.
 */
export const INSERT_TOP_CONCEPT_LABEL = 'Add an Existing Concept as a Top Concept'
export const INSERT_CONCEPT_LABEL = 'Add an Existing Concept'

/**
 * #### Scheme Actions Menu
 * The overflow menu beside the tree's add controls, for the things that act on
 * the scheme as a whole rather than on one row.
 *
 * It holds the two root inserts. Adding an existing concept at the root is not
 * an "add" — nothing is created — so it belongs behind the menu rather than
 * beside the buttons that make new concepts.
 *
 * `InsertAboveIcon` here against the row control's `InsertBelowIcon`: these put
 * a concept at the top level, while the row control files one *under* the
 * concept whose row it sits on. The pair reads as the direction each one goes.
 */
export function SchemeActionsMenu({
  onInsertTopConcept,
  onInsertConcept,
}: {
  onInsertTopConcept: () => void
  onInsertConcept: () => void
}) {
  return (
    <MenuButton
      id="scheme-actions-menu"
      button={
        // `MenuButton` needs a ref to its button element, and a Tooltip around
        // it breaks that chain — the popover then has no reference element and
        // throws. Studio's own WorkspaceMenuButton solves it the same way: give
        // MenuButton a Flex to hold, and put the tooltip inside it.
        <Flex>
          <Tooltip
            delay={{open: 750}}
            content={
              <Box padding={1} sizing="content">
                <Text muted size={1}>
                  {MORE_ACTIONS_TOOLTIP}
                </Text>
              </Box>
            }
            fallbackPlacements={['right', 'left']}
            placement="top"
            portal
          >
            <Button
              id="scheme-actions-button"
              icon={EllipsisHorizontalIcon}
              mode="bleed"
              paddingY={2}
              aria-label={MORE_ACTIONS_TOOLTIP}
            />
          </Tooltip>
        </Flex>
      }
      menu={
        <Menu>
          <MenuItem
            icon={InsertAboveIcon}
            text={INSERT_TOP_CONCEPT_LABEL}
            onClick={onInsertTopConcept}
          />
          <MenuItem icon={InsertAboveIcon} text={INSERT_CONCEPT_LABEL} onClick={onInsertConcept} />
        </Menu>
      }
      popover={{portal: true, placement: 'bottom-end'}}
    />
  )
}
