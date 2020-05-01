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

module.exports.server = (serv, { version }) => {
  const mcData = require('minecraft-data')(version)

  const itemPlaceHandlers = new Map()
  serv.placeItem = (item, direction) => {
    const handler = itemPlaceHandlers.get(item.type)
    return handler ? handler(item, direction) : { id: item.type, data: item.metadata }
  }
  /**
   * The handler is called when an item of the given type is
   * used to place a block. Arguments are the item and direction
   * It should return the id and data of the block to place
   */
  serv.onItemPlace = (name, handler) => {
    let item = mcData.itemsByName[name]
    if (!item) item = mcData.blocksByName[name]
    itemPlaceHandlers.set(item.id, handler)
  }

  serv.onItemPlace('sign', (item, direction) => {
    // TODO: wall sign direction
    return { id: direction === 1 ? 63 : 68, data: 0 }
  })
}

module.exports.player = function (player, serv, { version }) {
  const blocks = require('minecraft-data')(version).blocks

  player._client.on('block_place', ({ direction, location } = {}) => {
    const heldItem = player.inventory.slots[36 + player.heldItemSlot]
    if (heldItem === undefined || direction === -1 || heldItem.type === -1) return
    const { id, data } = serv.placeItem(heldItem, direction)
    if (!blocks[id]) return
    const referencePosition = new Vec3(location.x, location.y, location.z)
    const directionVector = directionToVector[direction]
    const placedPosition = referencePosition.plus(directionVector)
    player.behavior('placeBlock', {
      direction: directionVector,
      heldItem: heldItem,
      id,
      damage: data,
      position: placedPosition,
      reference: referencePosition,
      playSound: true,
      sound: 'dig.' + (materialToSound[blocks[id].material] || 'stone')
    }, ({ position, playSound, sound, id, damage }) => {
      if (playSound) {
        serv.playSound(sound, player.world, placedPosition.clone().add(new Vec3(0.5, 0.5, 0.5)), {
          pitch: 0.8
        })
      }

      if (player.gameMode === 0) { player.inventory.slots[36 + player.heldItemSlot]-- }

      player.setBlock(position, id, damage)

      if (id === 63 || id === 68) {
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
