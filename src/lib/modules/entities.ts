export const server = function (serv: Server) {
  let ticking = false
  serv.on('tick', function (delta) {
    if (ticking || delta > 1) { return }
    ticking = true
    Promise.all(
      Object.keys(serv.entities).map(async (id) => {
        const entity = serv.entities[id]
        if (entity.deathTime && Date.now() - entity.bornTime >= entity.deathTime) {
          entity.destroy()
          return
        } else if (entity.pickupTime && Date.now() - entity.bornTime >= entity.pickupTime) {
          const players = serv.getNearby({
            world: entity.world,
            position: entity.position,
            radius: 1.75 // Seems good for now
          })
          if (players.length) {
            players[0].collect(entity)
          }
        }
        if (!entity.velocity || !entity.size) return
        const { position, onGround } = await entity.calculatePhysics(delta)
        if (entity.type === 'mob' ||
          (entity.type === 'object' &&
            (
              entity.velocity.x !== 0 ||
              entity.velocity.y !== 0 ||
              entity.velocity.z !== 0
            )
          )) entity.sendPosition(position, onGround)
      })
    )
      .then(() => { ticking = false })
      .catch((err) => setTimeout(() => { throw err }, 0))
  })
}

export const entity = function (entity) {
  entity.sendMetadata = (data) => {
    entity._writeOthersNearby('entity_metadata', {
      entityId: entity.id,
      metadata: data
    })
  }

  entity.setAndUpdateMetadata = (data) => {
    entity.metadata = data
    entity.sendMetadata(data)
  }
}
declare global {
  interface Entity {
    /** How much time before an entity despawns (in ms) */
    deathTime?: number
    /** How long before an entity can be picked up (in ms) */
    pickupTime?: number
    /** Sub-category of entity. For mobs, this is which mob (Zombie/Skeleton, etc). For objects, this is which object (Arrow/Dropped item, etc) */
    name?: string
    /** Either "player", "mob", or "object" (currently) */
    type: string
    /** @internal */
    "sendMetadata": (data: any) => void
    /** @internal */
    "setAndUpdateMetadata": (data: any) => void
  }
}
