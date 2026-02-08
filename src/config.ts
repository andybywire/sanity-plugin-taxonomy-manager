import type {Options} from './types'

let taxonomyManagerConfig: Options | undefined

/**
 * #### Manage Plugin Config
 * Store the user preferences config in a module-level
 * variable when the plugin initializes
 */
export function setPluginConfig(config: Options | undefined): void {
  taxonomyManagerConfig = config
}

export function getPluginConfig(): Options | undefined {
  return taxonomyManagerConfig
}
