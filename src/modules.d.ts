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
  interface Options extends Record<string, any> { } // todo
}
