import {EventEmitter} from 'events';
import * as mc from 'minecraft-protocol';
import _Command from './lib/command';
import _Behaviour from './lib/behavior'
import * as Gen from './lib/generations';
import {supportedVersions as SupportedVersions, Version} from './lib/version'
import * as path from 'path'
import requireIndex from './lib/requireIndex';
import supportFeature from './lib/supportFeature'
import * as Experience from './lib/experience'
import _UserError from './lib/user_error';
import PortalDetector from './lib/portal_detector';
// version check
if (typeof process !== 'undefined' && parseInt(process.versions.node.split('.')[0]) < 14) {
  console.error('Your node version is currently', process.versions.node)
  console.error('Please update it to a version >= 14.x.x from https://nodejs.org/')
  process.exit(1)
}
export const supportedVersions: Version[] = SupportedVersions
require('emit-then').register()
if (process.env.NODE_ENV !== 'production'){
  eval(`require('longjohn');`); // Blame parcel thinking it should bundle longjohn
}

export const Command = _Command,
  generations = Gen,
  experience = Experience,
  UserError = _UserError,
  portal_detector = PortalDetector,
  Behaviour = _Behaviour;
export const createMCServer = (options) => {
  options = options || {}
  const mcServer = new MCServer()
  mcServer.connect(options)
  return mcServer
}

export class MCServer extends EventEmitter {
  _server: mc.Server;
  supportFeature: (feature: any) => any;
  commands: _Command;

  constructor () {
    super()
    this._server = null
  }

  connect (options: mc.ServerOptions & Partial<{
    logging: boolean;
  }>) {
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
    // @ts-ignore
    this._server.on('error', error => this.emit('error', error))
    // @ts-ignore
    this._server.on('listening', () => this.emit('listening', this._server.socketServer.address().port))
    this.emit('asap')
  }
  createLog() {
    throw new Error('Method not implemented.');
  }
}

export default createMCServer