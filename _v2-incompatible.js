/**
 * cf. https://github.com/sanity-io/sanity-plugin-iframe-pane/blob/main/v2-incompatible.js
 */

const {showIncompatiblePluginDialog} = require('@sanity/incompatible-plugin')
const {name, version, sanityExchangeUrl} = require('./package.json')

export default showIncompatiblePluginDialog({
  name: name,
  versions: {
    v3: version,
    v2: undefined,
  },
  sanityExchangeUrl,
})
