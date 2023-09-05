if (typeof process !== 'undefined' && !process.browser && process.platform !== 'browser' && parseInt(process.versions.node.split('.')[0]) < 18) {
  console.error('[\x1b[31mCRITICAL\x1b[0m] Node.JS 18 or newer is required')
  console.error('[\x1b[31mCRITICAL\x1b[0m] You can download the new version from https://nodejs.org/')
  console.error(`[\x1b[31mCRITICAL\x1b[0m] Your current Node.JS version is: ${process.versions.node}`)
  process.exit(1)
}

const { createServer } = require('minecraft-protocol')

const EventEmitter = require('events').EventEmitter
const supportedVersions = require('./lib/version').supportedVersions
const Command = require('./lib/command')
const plugins = require('./lib/plugins')
require('emit-then').register()
if (process.env.NODE_ENV === 'dev') {
  require('longjohn')
}

const supportFeature = require('./lib/supportFeature')

module.exports = {
  createMCServer,
  Behavior: require('./lib/behavior'),
  Command: require('./lib/command'),
  generations: require('./lib/generations'),
  experience: require('./lib/experience'),
  UserError: require('./lib/user_error'),
  portal_detector: require('./lib/portal_detector'),
  supportedVersions
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
    const version = require('minecraft-data')(options.version).version
    if (!supportedVersions.some(v => v.includes(version.majorVersion))) {
      throw new Error(`Version ${version.minecraftVersion} is not supported.`)
    }
    this.supportFeature = feature => supportFeature(feature, version.majorVersion)
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
