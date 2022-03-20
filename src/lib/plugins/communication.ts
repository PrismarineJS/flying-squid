export const server = function (serv: { _writeAll: (packetName: any, packetFields: any) => any; players: any[]; _writeArray: { (arg0: any, arg1: any, arg2: any): any; (packetName: any, packetFields: any, players: any): any }; _writeNearby: (packetName: any, packetFields: any, loc: any) => any; getNearby: { (arg0: any): any; ({ world, position, radius }: { world: any; position: any; radius?: number }): any }; getNearbyEntities: ({ world, position, radius }: { world: any; position: any; radius?: number }) => any[]; entities: { [x: string]: any } }) {
  serv._writeAll = (packetName: any, packetFields: any) =>
    serv.players.forEach((player: { _client: { write: (arg0: any, arg1: any) => any } }) => player._client.write(packetName, packetFields))

  serv._writeArray = (packetName: any, packetFields: any, players: any[]) =>
    players.forEach((player: { _client: { write: (arg0: any, arg1: any) => any } }) => player._client.write(packetName, packetFields))

  serv._writeNearby = (packetName: any, packetFields: any, loc: any) =>
    serv._writeArray(packetName, packetFields, serv.getNearby(loc))

  serv.getNearby = ({ world, position, radius = 8 * 16 }) => serv.players.filter((player: { world: any; position: { distanceTo: (arg0: any) => number } }) =>
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

export const entity = function (entity: { getNearby: { (): any[]; (): any }; world: any; position: any; viewDistance: any; getOtherPlayers: { (): any; (): any }; getOthers: () => any; getNearbyPlayers: { (): any[]; (radius?: any): any }; nearbyPlayers: (radius?: any) => any; nearbyEntities: any[]; _writeOthers: (packetName: any, packetFields: any) => any; _writeOthersNearby: (packetName: any, packetFields: any) => any; _writeNearby: (packetName: any, packetFields: any) => any; type: string }, serv: { getNearbyEntities: (arg0: { world: any; position: any; radius: any }) => any[]; players: any[]; entities: any[]; _writeArray: (arg0: any, arg1: any, arg2: any) => any }) {
  entity.getNearby = () => serv
    .getNearbyEntities({
      world: entity.world,
      position: entity.position,
      radius: entity.viewDistance
    })
    .filter((e: any) => e !== entity)

  entity.getOtherPlayers = () => serv.players.filter((p: any) => p !== entity)

  entity.getOthers = () => serv.entities.filter((e: any) => e !== entity)

  // TODO: Use radius
  entity.getNearbyPlayers = (_radius = entity.viewDistance) => entity.getNearby()
    .filter((e: { type: string }) => e.type === 'player')

  // TODO: Use radius
  entity.nearbyPlayers = (_radius = entity.viewDistance) => entity.nearbyEntities
    .filter((e: { type: string }) => e.type === 'player')

  entity._writeOthers = (packetName: any, packetFields: any) =>
    serv._writeArray(packetName, packetFields, entity.getOtherPlayers())

  entity._writeOthersNearby = (packetName: any, packetFields: any) =>
    serv._writeArray(packetName, packetFields, entity.getNearbyPlayers())

  entity._writeNearby = (packetName: any, packetFields: any) =>
    serv._writeArray(packetName, packetFields, entity.getNearbyPlayers().concat(entity.type === 'player' ? [entity] : []))
}
