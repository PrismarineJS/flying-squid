import { createServer, Server as ProtocolServer } from 'minecraft-protocol'

import { testedVersions, latestSupportedVersion, oldestSupportedVersion } from './lib/version'
import Command from './lib/command'
import * as plugins from './lib/plugins'
import { EventEmitter } from 'events'

import { IndexedData } from 'minecraft-data'
import './types' // include Server declarations from all plugins
import './modules'

// #region RUNTIME PREPARE
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
// #endregion

// types

export interface FullServer extends Server { }
export interface FullPlayer extends Player { }
export interface FullEntity extends Entity { }
export interface ServerEventsMap extends ServerEvents { }
export interface PlayerEventsMap extends PlayerEvents { }
// export interface EntityEventsMap extends ServerEvents {}
export type InputOptions = Partial<Options> & Pick<Options, 'version'>

export function createMCServer (options: InputOptions): FullServer {
  const mcServer = new MCServer()
  mcServer.connect({
    // defaults
    'max-entities': 100,
    ...options
  })
  return mcServer as unknown as Server
}

class MCServer extends EventEmitter {
  pluginsReady = false
  _server: ProtocolServer = null!
  constructor () {
    plugins.initPlugins()
    super()
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

    const promises: Array<Promise<any>> = []
    for (const plugin of plugins.builtinPlugins) {
      promises.push(plugin.server?.(server, options))
    }
    Promise.all(promises).then(() => {
      server.emit('pluginsReady')
      server.pluginsReady = true
    })

    if (options.logging === true) server.createLog()
    server._server.on('error', error => {
      server.emit('error', error)
    })
    server._server.on('listening', () => {
      // @ts-expect-error dont remember the right cast
      server.emit('listening', server._server.socketServer.address().port)
    })
    server.emit('asap')
  }
}

declare global {
  interface Server {
    commands: Command
    pluginsReady: boolean
    _server: ProtocolServer
    supportFeature: (feature: string) => boolean
  }
}

export {
  testedVersions
}

export * as Behavior from './lib/behavior'
export * as Command from './lib/command'
export { default as generations } from './lib/generations'
export * as experience from './lib/experience'
export * as UserError from './lib/user_error'
export { default as portal_detector } from './lib/portal_detector'
