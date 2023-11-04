import { createServer } from 'minecraft-protocol'

import { testedVersions, latestSupportedVersion, oldestSupportedVersion } from './lib/version'
import Command from './lib/command'
import * as plugins from './lib/modules'
import { EventEmitter } from 'events'
import { Server as ProtocolServer } from 'minecraft-protocol'
import { IndexedData } from 'minecraft-data'
import './types' // include Server declarations from all modules
import './modules'

if (typeof process !== 'undefined' && !process.browser && process.platform !== 'browser' && parseInt(process.versions.node.split('.')[0]) < 18) {
  console.error('[\x1b[31mCRITICAL\x1b[0m] Node.JS 18 or newer is required')
  console.error('[\x1b[31mCRITICAL\x1b[0m] You can download the new version from https://nodejs.org/')
  console.error(`[\x1b[31mCRITICAL\x1b[0m] Your current Node.JS version is: ${process.versions.node}`)
  process.exit(1)
}

require('emit-then').register()
if (process.env.NODE_ENV === 'dev') {
  require('longjohn')
}

type InputOptions = Partial<Options> & Pick<Options, 'version'>

export function createMCServer (options: InputOptions) {
  const mcServer = new MCServer()
  mcServer.connect({
    // defaults
    "max-entities": 100,
    ...options
  })
  return mcServer as unknown as Server
}

class MCServer extends EventEmitter {
  constructor () {
    plugins.initPlugins()
    super()
    this._server = null
    this.pluginsReady = false
  }

  connect (options) {
    const server = this as unknown as Server
    const registry = require('prismarine-registry')(options.version)
    if (!registry?.version) throw new Error(`Server version '${registry?.version}' is not supported, no data for version`)

    const versionData = registry.version
    if (versionData['>'](latestSupportedVersion)) {
      throw new Error(`Server version '${registry?.version}' is not supported. Latest supported version is '${latestSupportedVersion}'.`)
    } else if (versionData['<'](oldestSupportedVersion)) {
      throw new Error(`Server version '${registry?.version}' is not supported. Oldest supported version is '${oldestSupportedVersion}'.`)
    }

    server.commands = new Command({})
    server._server = createServer(options)
    server.mcData = mcData

    const promises: Promise<any>[] = []
    for (const plugin of plugins.builtinPlugins) {
      promises.push(plugin.server?.(server, options))
    }
    Promise.all(promises).then(() => {
      server.emit('pluginsReady')
      server.pluginsReady = true
    })

    if (options.logging === true) server.createLog()
    server._server.on('error', error => {
      server.emit('error', error);
    })
    server._server.on('listening', () => {
      server.emit('listening', server._server.socketServer.address().port);
    })
    server.emit('asap')
  }
}

declare global {
  interface Server {
    mcData: IndexedData
    commands: Command
    pluginsReady: boolean
    _server: ProtocolServer
    supportFeature: (feature: string) => boolean
  }
}

export {
  createMCServer,
  testedVersions
}

export * as Behavior from './lib/behavior';
export * as Command from './lib/command';
export * as generations from './lib/generations';
export * as experience from './lib/experience';
export * as UserError from './lib/user_error';
export * as portal_detector from './lib/portal_detector';
