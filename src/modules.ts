import { Client } from 'minecraft-protocol'
import TypedEmitter from 'typed-emitter'
import EventEmitter from 'events'

// all is coherent and stays in the same place
declare global {
  interface PlayerEvents {
    asap: () => void
    loadingStatus: (status: string) => void
    connected: () => void
    spawned: () => void
    disconnected: (reason: string) => void
    kicked: (kicker: Player, reason: string) => void
    move: () => void
    change_world: () => void
    modpe: (data: string) => void
  }

  interface ServerEvents {
    error: (error: Error) => void
    listening: (port: number) => void
    pluginsReady: () => void
    /** This event is emitted once all plugins are initialized. Use this event for working with properties / methods of other plugins. */
    asap: () => void
    unhandledRejectionWarning: () => void
    crash: () => void
    clientError: (client: Client, error: Error) => void
    newPlayer: (player: Player) => void
    banned: (player: Pick<Player, 'username'>, username: string, reason: string) => void
    newEntity: (entity: Entity) => void
    tick: (delta: number, tickCount: number) => void
    /** Emit seed once the world is loaded */
    seed: (seed: number) => void
  }

  interface Server extends TypedEmitter<ServerEvents> { }
  // Omit is to allow inheritance of Entity
  interface Player extends Omit<Entity, keyof TypedEmitter<{}>>, TypedEmitter<PlayerEvents> {
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
