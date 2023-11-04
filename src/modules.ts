import { EventEmitter } from 'events'
import { Client } from 'minecraft-protocol'

declare global {
  interface Server extends EventEmitter { }
  interface Player extends EventEmitter, Entity {
    _client: Client
  }
  interface Entity extends EventEmitter {
    _client: Client
  }
  interface Options {
    version: string
    /** initial write level name */
    levelName?: string
    motd?: string
    port?: number
    "max-players"?: number
    "online-mode"?: boolean
    logging?: boolean
    gameMode?: number
    difficulty?: number
    worldFolder?: string
    generation?: {
      name: string
      options: {
        worldHeight?: number
        seed?: number
        version?: string
      }
    }
    kickTimeout?: number
    plugins?: Record<string, any>
    modpe?: boolean
    "view-distance"?: number
    "player-list-text"?: {
      header: {
        text: string
      }
      footer: {
        text: string
      }
    }
    "everybody-op"?: boolean
    "max-entities": number
    noConsoleOutput?: boolean
    savingInterval?: number | false
  }
}
