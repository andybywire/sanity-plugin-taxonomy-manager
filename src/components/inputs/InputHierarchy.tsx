/* eslint-disable react/require-default-props */
import {useContext} from 'react'
import {Flex, Spinner, Box, Text} from '@sanity/ui'
import {useListeningQuery} from 'sanity-plugin-utils'
import {inputBuilder} from '../../queries'
import {DocumentConcepts} from '../../types'
import {SchemeContext, TreeContext} from '../../context'
import {TreeStructure} from '../TreeStructure'
import {NewScheme} from '../guides'

/**
 *  Input Hierarchy Component
 * - Provides a frame for global controls and tree structure
 * - Fetches the complete tree of concepts in a concept scheme.
 * - Displays the tree in a nested list.
 *
 * @param inputComponent - Specifies whether the component is a Studio
 *   input component. Set in HierarchyInput and passed through TreeView
 *
 * TODO: type document, likely via extended SanityDocument type.
 */
export const InputHierarchy = ({
  branchId = '',
  selectConcept,
  inputComponent,
}: {
  branchId: string
  selectConcept?: any
  inputComponent: Boolean
}) => {
  const document: any = useContext(SchemeContext) || {}
  const documentId = document.displayed?._id

  // likely don't need to listen here. Consider simplifying.
  const {data, loading, error} = useListeningQuery<DocumentConcepts>(
    {
      fetch: inputBuilder(),
      listen: `*[_type == "skosConcept" || _id == $id]`,
    },
    {
      params: {id: documentId, branchId},
    },
  ) as {data: DocumentConcepts; loading: boolean; error: Error | null}
  if (loading) {
    return (
      <Box padding={5}>
        <Flex
          align="center"
          direction="column"
          gap={5}
          height="fill"
          justify="center"
          style={{paddingTop: '1rem'}}
        >
          <Spinner muted />
          <Text muted size={1}>
            Loading hierarchy…
          </Text>
        </Flex>
      </Box>
    )
  } else if (error) {
    console.warn(error)
    return <div>error</div>
  } else if (!data) {
    return <NewScheme document={document} />
  }
  return (
    <TreeContext.Provider value={{globalVisibility: {treeId: '123', treeVisibility: 'open'}}}>
      <Box padding={4}>
        <TreeStructure
          concepts={data}
          inputComponent={inputComponent}
          selectConcept={selectConcept}
        />
      </Box>
    </TreeContext.Provider>
  )
}

export default InputHierarchy
