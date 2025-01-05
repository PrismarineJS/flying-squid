if (typeof process !== 'undefined' && !process.browser && process.platform !== 'browser' && parseInt(process.versions.node.split('.')[0]) < 18) {
  console.error('[\x1b[31mCRITICAL\x1b[0m] Node.JS 18 or newer is required')
  console.error('[\x1b[31mCRITICAL\x1b[0m] You can download the new version from https://nodejs.org/')
  console.error(`[\x1b[31mCRITICAL\x1b[0m] Your current Node.JS version is: ${process.versions.node}`)
  process.exit(1)
}

const { createServer } = require('minecraft-protocol')

const { EventEmitter } = require('events')
const { testedVersions, latestSupportedVersion, oldestSupportedVersion } = require('./lib/version')
const Command = require('./lib/command')
const plugins = require('./lib/plugins')
const { onceWithTimeout } = require('./lib/utils')

module.exports = {
  createMCServer,
  Behavior: require('./lib/behavior'),
  Command: require('./lib/command'),
  generations: require('./lib/generations'),
  experience: require('./lib/experience'),
  UserError: require('./lib/user_error'),
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
    this.commands = new Command({})
    this._server = createServer(options)
    const registry = require('prismarine-registry')(options.version)
    if (!registry?.version) throw new Error(`Server version '${options.version}' is not supported, no data for version`)

    const versionData = registry.version
    if (versionData['>'](latestSupportedVersion)) {
      throw new Error(`Server version '${options.version}' is not supported. Latest supported version is '${latestSupportedVersion}'.`)
    } else if (versionData['<'](oldestSupportedVersion)) {
      throw new Error(`Server version '${options.version}' is not supported. Oldest supported version is '${oldestSupportedVersion}'.`)
    }

    // internal features until merged into minecraft-data
    const customFeatures = {}
    this.registry = registry
    this.supportFeature = feature => customFeatures[feature] ?? registry.supportFeature(feature)

    Promise.all([onceWithTimeout(this, 'pluginsReady', 5000), onceWithTimeout(this._server, 'listening', 5000)]).then(() => {
      this.isReady = true
      this.emit('ready')
    })

    const promises = []
    for (const plugin of plugins.builtinPlugins) {
      promises.push(plugin.server?.(this, options))
    }
    Promise.all(promises).then(() => {
      this.emit('pluginsReady')
      this.pluginsReady = true
      this.debug?.('Loaded plugins')
    })

    this.waitForReady = async function (timeout) {
      if (this.isReady) return true
      return onceWithTimeout(this, 'ready', timeout)
    }

    if (options.logging === true) this.createLog()
    this._server.on('error', error => this.emit('error', error))
    this._server.on('listening', () => {
      this.listeningPort = this._server.socketServer.address().port
      this.emit('listening', this.listeningPort)
    })
    this.emit('asap')
  }

  async destroy () {
    this.isClosed = true
    this.isReady = false
    this.pluginsReady = false
    this.emit('close')
    for (const player of this.players) {
      player._client.write = function () {
        throw new Error('Tried to write to a closed connection')
      }
    }
    if (this._server) {
      this._server.close()
      return onceWithTimeout(this._server, 'close', 1000)
    }
  }
}
