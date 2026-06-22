import {describe, expect, it} from 'vitest'

import * as publicApi from './index'

// The consumer contract: exactly these names are exported, and the plugin
// registers exactly these two schema types. Renaming or removing any is a
// breaking change — pin them so it can't happen by accident before 5.0.0.

describe('public export surface', () => {
  it('exports exactly the six documented members', () => {
    expect(Object.keys(publicApi).sort()).toEqual(
      [
        'ArrayHierarchyInput',
        'ReferenceHierarchyInput',
        'TreeView',
        'branchFilter',
        'schemeFilter',
        'taxonomyManager',
      ].sort()
    )
  })

  it('registers the plugin under its documented name with both schema types', () => {
    const plugin = publicApi.taxonomyManager({})
    expect(plugin.name).toBe('taxonomyManager')

    const types = plugin.schema?.types
    const typeNames = Array.isArray(types) ? types.map((type) => type.name).sort() : []
    expect(typeNames).toEqual(['skosConcept', 'skosConceptScheme'])
  })
})
