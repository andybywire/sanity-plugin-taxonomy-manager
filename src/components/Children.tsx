/* eslint-disable complexity */
// TO DO: abstract out components
import {
  ErrorOutlineIcon,
  InfoOutlineIcon,
  AddCircleIcon,
  TrashIcon,
  ToggleArrowRightIcon,
} from '@sanity/icons'
import {Inline, Tooltip, Box, Flex, Text, Button} from '@sanity/ui'
import {useCallback, useContext, useState} from 'react'

import {ReleaseContext, SchemeContext, TreeContext} from '../context'
import {useCreateConcept, useRemoveConcept} from '../hooks'
import type {ChildConceptTerm, ConceptSchemeDocument} from '../types'

import {ChildConcepts} from './ChildConcepts'
import styles from './Children.module.css'
import {ConceptDetailDialogue} from './interactions/ConceptDetailDialogue'
import {ConceptDetailLink} from './interactions/ConceptDetailLink'
import {ConceptSelectLink} from './interactions/ConceptSelectLink'

/**
 * #### Child Concept Component
 * Renders a list of child concepts for a given concept.
 */
export const Children = ({
  concept,
  selectConcept,
  inputComponent = false,
}: {
  concept: ChildConceptTerm
  selectConcept: (conceptId: {
    _ref: string
    _type: 'reference'
    _originalId: string | undefined
  }) => void
  inputComponent: boolean
}) => {
  const document: ConceptSchemeDocument = useContext(SchemeContext) || ({} as ConceptSchemeDocument)
  const releaseContext: string = useContext(ReleaseContext) as string
  const {
    // @ts-expect-error — sort out type
    globalVisibility: {treeVisibility},
  } = useContext(TreeContext) || {}
  const createConcept = useCreateConcept(document)
  const removeConcept = useRemoveConcept(document)

  const handleAddChild = useCallback(() => {
    createConcept('concept', concept)
  }, [concept, createConcept])

  const handleRemoveConcept = useCallback(() => {
    removeConcept(concept.id, 'concept', concept?.prefLabel)
  }, [concept.id, concept?.prefLabel, removeConcept])

  const [levelVisibility, setLevelVisibility] = useState<'open' | 'closed'>(
    (treeVisibility as 'open' | 'closed') || 'open'
  )

  const handleToggle = useCallback(() => {
    if (levelVisibility == 'open') {
      setLevelVisibility('closed')
    } else if (levelVisibility == 'closed') {
      setLevelVisibility('open')
    }
  }, [levelVisibility])

  // const childrenClass =
  //   concept?.childConcepts && concept.childConcepts.length == 0
  //     ? styles.noChildren
  //     : styles.hasChildren

  return (
    // the list of child terms
    <Box className={[levelVisibility, styles.children].join(' ')}>
      <Flex align={'center'} justify={'space-between'} wrap={'nowrap'}>
        {/* Toggle, label, tag */}
        <Flex align="center" gap={0} flex={1} style={{minWidth: 0}}>
          {concept?.childConcepts && concept.childConcepts.length > 0 && (
            <Button
              icon={ToggleArrowRightIcon}
              mode={'bleed'}
              aria-expanded={levelVisibility == 'open'}
              onClick={handleToggle}
            />
          )}
          {!concept?.prefLabel && (
            <Box marginLeft={!concept.childConcepts || concept.childConcepts.length == 0 ? 5 : 0}>
              <Text muted size={2}>
                [new concept]
              </Text>
            </Box>
          )}
          <Box
            flex={1}
            marginLeft={!concept.childConcepts || concept.childConcepts.length == 0 ? 5 : 0}
          >
            {inputComponent ? (
              <ConceptSelectLink concept={concept} selectConcept={selectConcept} />
            ) : (
              <ConceptDetailLink concept={concept} />
            )}
          </Box>
          {inputComponent && <ConceptDetailDialogue concept={concept} />}
        </Flex>
        {!inputComponent &&
          releaseContext !== 'published' &&
          concept?.level &&
          concept.level < 5 && (
            <Inline>
              <Tooltip
                delay={{open: 750}}
                content={
                  <Box padding={1} sizing="content">
                    <Text muted size={1}>
                      Add a child concept below this concept
                    </Text>
                  </Box>
                }
                fallbackPlacements={['right', 'left']}
                placement="top"
              >
                <Button
                  icon={AddCircleIcon}
                  mode={'bleed'}
                  onClick={handleAddChild}
                  tone={'positive'}
                  aria-label="Add child a child concept below this concept"
                />
              </Tooltip>
              <Tooltip
                delay={{open: 750}}
                content={
                  <Box padding={1} sizing="content">
                    <Text muted size={1}>
                      Remove this concept from this scheme
                    </Text>
                  </Box>
                }
                fallbackPlacements={['right', 'left']}
                placement="top"
              >
                <Button
                  icon={TrashIcon}
                  mode={'bleed'}
                  onClick={handleRemoveConcept}
                  tone={'critical'}
                  aria-label="Remove this concept from this scheme"
                />
              </Tooltip>
            </Inline>
          )}

        {!inputComponent &&
          releaseContext !== 'published' &&
          concept.childConcepts?.length == 0 &&
          concept.level == 5 && (
            <Inline>
              <Tooltip
                delay={{open: 750}}
                content={
                  <Box padding={1} sizing="content">
                    <Text muted size={1}>
                      This concept is at the maximum Taxonomy Manager hierarchy depth of 5 levels.
                    </Text>
                  </Box>
                }
                fallbackPlacements={['right', 'left']}
                placement="top"
              >
                <InfoOutlineIcon className={[styles.info, styles.warning].join(' ')} />
              </Tooltip>
              <Tooltip
                delay={{open: 750}}
                content={
                  <Box padding={1} sizing="content">
                    <Text muted size={1}>
                      Remove this concept from this scheme
                    </Text>
                  </Box>
                }
                fallbackPlacements={['right', 'left']}
                placement="top"
              >
                <Button
                  icon={TrashIcon}
                  mode={'bleed'}
                  onClick={handleRemoveConcept}
                  tone={'critical'}
                  aria-label="Remove this concept from this scheme"
                />
              </Tooltip>
            </Inline>
          )}

        {concept?.childConcepts && concept?.childConcepts?.length > 0 && concept.level == 5 && (
          <Inline space={1}>
            <Tooltip
              delay={{open: 750}}
              content={
                <Box padding={1} sizing="content">
                  <Text muted size={1}>
                    This concept has unlisted child concepts. The maximum validated hierarchy depth
                    is 5 levels.
                  </Text>
                </Box>
              }
              fallbackPlacements={['right', 'left']}
              placement="top"
            >
              <ErrorOutlineIcon className={[styles.info, styles.error].join(' ')} />
            </Tooltip>
            {!inputComponent && releaseContext !== 'published' && (
              <Tooltip
                delay={{open: 750}}
                content={
                  <Box padding={1} sizing="content">
                    <Text muted size={1}>
                      Remove this concept from this scheme
                    </Text>
                  </Box>
                }
                fallbackPlacements={['right', 'left']}
                placement="top"
              >
                <Button
                  icon={TrashIcon}
                  mode={'bleed'}
                  onClick={handleRemoveConcept}
                  tone={'critical'}
                  aria-label="Remove this concept from this scheme"
                />
              </Tooltip>
            )}
          </Inline>
        )}
      </Flex>
      {concept?.childConcepts &&
        concept.childConcepts.length > 0 &&
        concept?.level &&
        concept.level < 5 && (
          <ChildConcepts
            concepts={concept.childConcepts}
            selectConcept={selectConcept}
            inputComponent={inputComponent}
            childVisibility={levelVisibility}
          />
        )}
    </Box>
  )
}
