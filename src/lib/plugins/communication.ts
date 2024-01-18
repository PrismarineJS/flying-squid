import { Vec3 } from 'vec3'

export const server = function (serv: Server) {
  serv._writeAll = (packetName, packetFields) =>
    serv.players.forEach((player) => player._client.write(packetName, packetFields))

  serv._writeArray = (packetName, packetFields, players) =>
    players.forEach((player) => player._client.write(packetName, packetFields))

  serv._writeNearby = (packetName, packetFields, loc) =>
    serv._writeArray(packetName, packetFields, serv.getNearby(loc))

  serv.getNearby = ({ world, position, radius = 8 * 16 }) => serv.players.filter(player =>
    player.world === world &&
    player.position.distanceTo(position) <= radius
  )

  serv.getNearbyEntities = ({ world, position, radius = 8 * 16 }) => Object.keys(serv.entities)
    .map(eId => serv.entities[eId])
    .filter(entity =>
      entity.world === world &&
      entity.position.distanceTo(position) <= radius
    )
}

export const entity = function (entity: Entity, serv: Server) {
  entity.getNearby = () => serv
    .getNearbyEntities({
      world: entity.world,
      position: entity.position,
      radius: entity.viewDistance
    })
    .filter((e) => e !== entity)

  entity.getOtherPlayers = () => serv.players.filter((p) => p !== entity)

  entity.getOthers = () => Object.fromEntries(Object.entries(serv.entities).filter(([id]) => id !== entity.id))

  entity.getNearbyPlayers = (radius = entity.viewDistance) => entity.getNearby()
    .filter((e) => e.type === 'player' && entity.position.distanceTo(entity.position) <= radius) as Player[]

  entity.nearbyPlayers = (radius = entity.viewDistance) => entity.nearbyEntities
    .filter(e => e.type === 'player' && entity.position.distanceTo(entity.position) <= radius) as Player[]

  entity._writeOthers = (packetName, packetFields) =>
    serv._writeArray(packetName, packetFields, entity.getOtherPlayers())

  entity._writeOthersNearby = (packetName, packetFields) =>
    serv._writeArray(packetName, packetFields, entity.getNearbyPlayers())

  entity._writeNearby = (packetName, packetFields) =>
    serv._writeArray(packetName, packetFields, [...entity.getNearbyPlayers(), ...entity.type === 'player' ? [entity] : []])
}
declare global {
  interface Server {
    /** @internal */
    "_writeAll": (packetName: any, packetFields: any) => void
    /** @internal */
    "_writeArray": (packetName: any, packetFields: any, players: any) => void
    /** @internal */
    '_writeNearby': (packetName: any, packetFields: any, loc: { world: Player['world'], position: Vec3, radius?: number }) => void
    /** Returns array of players within loc. loc is a required paramater. The object contains:
     *
     * * world: World position is in
     * * position: Center position
     * * radius: Distance from position
     */
    'getNearby': (params: { world: Player['world'], position: Vec3, radius?: number }) => Player[]
    /** @internal */
    "getNearbyEntities": (params: { world: Player['world']; position: Vec3; radius?: number }) => Entity[]
  }
  interface Entity {
    /** Gets all entities nearby (within entity.viewDistance) */
    "getNearby": () => Entity[]
    /** Gets every player other than self (all players if entity is not a player) */
    "getOtherPlayers": () => Player[]
    /**
     * Get every other entity other than self
     * Should not be used repeatedly as it is a slow operation

     */
    "getOthers": () => Server['entities']
    /** Gets all nearby players regardless of what client thinks */
    "getNearbyPlayers": (radius?: number) => Player[]
    /** Gets all nearby players that client can see */
    "nearbyPlayers": (radius?: number) => Player[]
    /** @internal */
    "_writeOthers": (packetName: any, packetFields: any) => void
    /** @internal */
    "_writeOthersNearby": (packetName: any, packetFields: any) => void
    /** @internal */
    "_writeNearby": (packetName: any, packetFields: any) => void
  }
}
