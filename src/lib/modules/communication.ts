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

  // warning: might be slow
  entity.getOthers = () => Object.fromEntries(Object.entries(serv.entities).filter(([id]) => id !== entity.id))

  entity.getNearbyPlayers = (radius = entity.viewDistance) => entity.getNearby()
    .filter((e) => e.type === 'player')

  entity.nearbyPlayers = (radius = entity.viewDistance) => entity.nearbyEntities
    .filter(e => e.type === 'player')

  entity._writeOthers = (packetName, packetFields) =>
    serv._writeArray(packetName, packetFields, entity.getOtherPlayers())

  entity._writeOthersNearby = (packetName, packetFields) =>
    serv._writeArray(packetName, packetFields, entity.getNearbyPlayers())

  entity._writeNearby = (packetName, packetFields) =>
    serv._writeArray(packetName, packetFields, entity.getNearbyPlayers().concat(entity.type === 'player' ? [entity] : []))
}
declare global {
  interface Server {
    "_writeAll": (packetName: any, packetFields: any) => any
    "_writeArray": (packetName: any, packetFields: any, players: any) => any
    "_writeNearby": (packetName: any, packetFields: any, loc: any) => any
    "getNearby": ({ world, position, radius }: { world: any; position: any; radius?: number | undefined }) => any
    "getNearbyEntities": ({ world, position, radius }: { world: any; position: any; radius?: number | undefined }) => any[]
  }
  interface Entity {
    "getNearby": () => any
    "getOtherPlayers": () => any
    "getOthers": () => any
    "getNearbyPlayers": (radius?: any) => any
    "nearbyPlayers": (radius?: any) => any
    "_writeOthers": (packetName: any, packetFields: any) => any
    "_writeOthersNearby": (packetName: any, packetFields: any) => any
    "_writeNearby": (packetName: any, packetFields: any) => any
  }
}
