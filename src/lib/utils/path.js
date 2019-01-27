const path = require('path')
const requireIndex = require('../requireindex')
const thirdPartyPluginPath = path.resolve(__dirname, '../', '../', 'plugins')
const officialPluginsPath = path.resolve(__dirname, '../', 'plugins')

function allPlugins () {
  const officialPlugins = requireIndex(officialPluginsPath)
  const thirdPartyPlugins = requireIndex(thirdPartyPluginPath)
  const plugins = officialPlugins
  // Clone plugin with no namespace conflict
  Object.keys(thirdPartyPlugins)
    .forEach(pluginName => (plugins[`third-${pluginName}`] = thirdPartyPlugins[pluginName]))

  return plugins
}

module.exports = {
  thirdPartyPluginPath: thirdPartyPluginPath,
  officialPluginsPath: officialPluginsPath,
  allPlugins: allPlugins()
}
