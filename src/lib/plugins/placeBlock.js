const Vec3 = require('vec3').Vec3

const materialToSound = {
  undefined: 'stone',
  'rock': 'stone',
  'dirt': 'grass',
  'plant': 'grass',
  'wool': 'cloth',
  'web': 'cloth',
  'wood': 'wood'
}

module.exports.player = function (player, serv, { version }) {
  const blocks = require('minecraft-data')(version).blocks

  player._client.on('block_place', ({ direction, location } = {}) => {
    const heldItem = player.inventory.slots[36 + player.heldItemSlot]
    if (heldItem === undefined) return
    if (direction === -1 || heldItem.type === -1 || !blocks[heldItem.type]) return
    const referencePosition = new Vec3(location.x, location.y, location.z)
    const directionVector = directionToVector[direction]
    const placedPosition = referencePosition.plus(directionVector)
    player.behavior('placeBlock', {
      direction: directionVector,
      heldItem: heldItem,
      id: heldItem.type,
      damage: heldItem.metadata,
      position: placedPosition,
      reference: referencePosition,
      playSound: true,
      sound: 'dig.' + (materialToSound[blocks[heldItem.type].material] || 'stone')
    }, ({ direction, heldItem, position, playSound, sound, id, damage }) => {
      if (playSound) {
        serv.playSound(sound, player.world, placedPosition.clone().add(new Vec3(0.5, 0.5, 0.5)), {
          pitch: 0.8
        })
      }

      if (player.gameMode === 0) { player.inventory.slots[36 + player.heldItemSlot]-- }

      if (heldItem.type !== 323) {
        player.changeBlock(position, id, damage)
      } else if (direction === 1) {
        player.setBlock(position, 63, 0)
        player._client.write('open_sign_entity', {
          location: position
        })
      } else {
        player.setBlock(position, 68, 0)
        player._client.write('open_sign_entity', {
          location: position
        })
      }
    }, async () => {
      const id = await player.world.getBlockType(placedPosition)
      const damage = await player.world.getBlockData(placedPosition)
      player.sendBlock(placedPosition, id, damage)
    })
  })
}

const directionToVector = [new Vec3(0, -1, 0), new Vec3(0, 1, 0), new Vec3(0, 0, -1), new Vec3(0, 0, 1), new Vec3(-1, 0, 0), new Vec3(1, 0, 0)]
