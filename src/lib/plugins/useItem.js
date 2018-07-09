const Vec3 = require('vec3').Vec3

module.exports.player = function (player, serv, {version}) {
  const items = require('minecraft-data')(version).items

  player._client.on('block_place', ({direction, location} = {}) => {
    const heldItem = player.inventory.slots[36 + player.heldItemSlot]

    if (heldItem) {
      if (direction === -1 || heldItem.type === -1 || !items[heldItem.type]) return
    }
    const referencePosition = new Vec3(location.x, location.y, location.z)
    const directionVector = directionToVector[direction]
    const position = referencePosition.plus(directionVector)

    if (heldItem && heldItem.name === 'flint_and_steel') { player.use_flint_and_steel(referencePosition, directionVector, position) } else if (heldItem && heldItem.name === 'spawn_egg') { serv.spawnMob(heldItem.metadata, player.world, position) }
  })
}
const directionToVector = [new Vec3(0, -1, 0), new Vec3(0, 1, 0), new Vec3(0, 0, -1), new Vec3(0, 0, 1), new Vec3(-1, 0, 0), new Vec3(1, 0, 0)]
