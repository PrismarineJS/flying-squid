if (typeof process !== 'undefined' && !process.browser && process.platform !== 'browser' && parseInt(process.versions.node.split('.')[0]) < 18) {
  console.error('[\x1b[31mCRITICAL\x1b[0m] Node.JS 18 or newer is required')
  console.error('[\x1b[31mCRITICAL\x1b[0m] You can download the new version from https://nodejs.org/')
  console.error(`[\x1b[31mCRITICAL\x1b[0m] Your current Node.JS version is: ${process.versions.node}`)
  process.exit(1)
}

const { createServer } = require('minecraft-protocol')

const EventEmitter = require('events').EventEmitter
const { testedVersions, latestSupportedVersion, oldestSupportedVersion } = require('./lib/version')
const Command = require('./lib/command')
const plugins = require('./lib/plugins')
require('emit-then').register()
if (process.env.NODE_ENV === 'dev') {
  require('longjohn')
}

module.exports = {
  createMCServer,
  Behavior: require('./lib/behavior'),
  Command: require('./lib/command'),
  generations: require('./lib/generations'),
  experience: require('./lib/experience'),
  UserError: require('./lib/user_error'),
  portal_detector: require('./lib/portal_detector'),
  testedVersions
}

function createMCServer (options) {
  options = options || {}
  const mcServer = new MCServer()
  mcServer.connect(options)
  return mcServer
}

class MCServer extends EventEmitter {
  constructor () {
    plugins.initPlugins()
    super()
    this._server = null
    this.pluginsReady = false
  }

  connect (options) {
    const mcData = require('minecraft-data')(options.version)
    const version = mcData.version
    let { 0: maxMajor, 1: maxMinor, 2: maxPatch = 0 } = latestSupportedVersion.split('.')
    let { 0: minMajor, 1: minMinor, 2: minPatch = 0 } = oldestSupportedVersion.split('.')
    let { 0: major, 1: minor, 2: patch = 0 } = version.minecraftVersion.split('.')
    if (major > maxMajor || (major === maxMajor && minor > maxMinor) || (major === maxMajor && minor === maxMinor && patch > maxPatch)) {
      console.warn(`[WARNING] Version ${version.minecraftVersion} is newer than the latest supported version, ${latestSupportedVersion}`)
      console.warn(`[WARNING] The latest supported version is ${latestSupportedVersion}`)
      console.warn(`[WARNING] It is unlikely that flying-squid will work correctly with this version`)
    } else if (major < minMajor || (major === minMajor && minor < minMinor) || (major === minMajor && minor === minMinor && patch < minPatch)) {
      console.warn(`[WARNING] Version ${version.minecraftVersion} is older than the oldest supported version, ${oldestSupportedVersion}`)
      console.warn(`[WARNING] The oldest supported version is ${oldestSupportedVersion}`)
      console.warn(`[WARNING] It is unlikely that flying-squid will work correctly with this version`)
    } else if (!testedVersions.includes(version.majorVersion)) {
      console.warn(`[WARNING] Version ${version.minecraftVersion} is not unit tested`)
      console.warn(`[WARNING] The following versions are unit tested and officially supported:`)
      console.warn(`[WARNING] ${testedVersions.join(', ')}`)
      console.warn(`[WARNING] To disable this warning, switch to a tested version`)
    }

    this.supportFeature = feature => mcData.supportFeature(feature)
    this.commands = new Command({})
    this._server = createServer(options)

    const promises = []
    for (const plugin of plugins.builtinPlugins) {
      promises.push(plugin.server?.(this, options))
    }
    Promise.all(promises).then(() => {
      this.emit('pluginsReady')
      this.pluginsReady = true
    })

    if (options.logging === true) this.createLog()
    this._server.on('error', error => this.emit('error', error))
    this._server.on('listening', () => this.emit('listening', this._server.socketServer.address().port))
    this.emit('asap')
  }
}
