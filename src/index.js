if (typeof process !== 'undefined' && parseInt(process.versions.node.split('.')[0]) < 14) {
  console.error('Your node version is currently', process.versions.node)
  console.error('Please update it to a version >= 14.x.x from https://nodejs.org/')
  process.exit(1)
}

const mc = require('minecraft-protocol')
const EventEmitter = require('events').EventEmitter
const path = require('path')
const requireIndex = require('./lib/requireindex')
const supportedVersions = require('./lib/version').supportedVersions
const Command = require('./lib/command')
require('emit-then').register()
if (process.env.NODE_ENV === 'dev') {
  require('longjohn')
}

const supportFeature = require('./lib/supportFeature')

module.exports = {
  createMCServer: createMCServer,
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
    super()
    this._server = null
  }

  connect (options) {
    const version = require('minecraft-data')(options.version).version
    if (!supportedVersions.some(v => v.includes(version.majorVersion))) {
      throw new Error(`Version ${version.minecraftVersion} is not supported.`)
    }
    this.supportFeature = feature => supportFeature(feature, version.majorVersion)

    const plugins = requireIndex(path.join(__dirname, 'lib', 'plugins'))
    this.commands = new Command({})
    this._server = mc.createServer(options)
    Object.keys(plugins)
      .filter(pluginName => plugins[pluginName].server !== undefined)
      .forEach(pluginName => plugins[pluginName].server(this, options))
    if (options.logging === true) this.createLog()
    this._server.on('error', error => this.emit('error', error))
    this._server.on('listening', () => this.emit('listening', this._server.socketServer.address().port))
    this.emit('asap')
  }
}
