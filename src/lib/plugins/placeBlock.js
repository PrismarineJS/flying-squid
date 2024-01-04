const Vec3 = require('vec3').Vec3

const materialToSound = {
  undefined: 'stone',
  rock: 'stone',
  dirt: 'grass',
  plant: 'grass',
  wool: 'cloth',
  web: 'cloth',
  wood: 'wood'
}

module.exports.server = (serv, { version }) => {
  const registry = require('prismarine-registry')(version)

  const itemPlaceHandlers = new Map()
  serv.placeItem = (data) => {
    const item = data.item
    const handler = itemPlaceHandlers.get(item.type)
    if (handler) return handler(data)
    const block = registry.blocksByName[item.name]
    if (!block) return {}
    if (block.states?.length > 0) return { id: block.id, data: serv.setBlockDataProperties(block.defaultState - block.minStateId, block.states, data.properties) }
    return { id: block.id, data: item.metadata ?? 0 }
  }

  /**
   * The handler is called when an item of the given type is
   * used to place a block. Arguments are the item, direction
   * and angle
   * It should return the id and data of the block to place
   */
  serv.onItemPlace = (name, handler, warn = true) => {
    let item = registry.itemsByName[name]
    if (!item) item = registry.blocksByName[name]
    if (itemPlaceHandlers.has(item.id) && warn) {
      serv.warn(`onItemPlace handler was registered twice for ${name}`)
    }
    itemPlaceHandlers.set(item.id, handler)
  }

  if (registry.supportFeature('theFlattening')) {
    const parseValue = (value, state) => {
      if (state.type === 'enum') {
        return state.values.indexOf(value)
      }
      if (state.type === 'bool') {
        return value ? 0 : 1
      }
      return parseInt(value, 10)
    }

    serv.setBlockDataProperties = (baseData, states, properties) => {
      let data = 0
      let offset = 1
      for (let i = states.length - 1; i >= 0; i--) {
        const prop = states[i]
        let value = baseData % prop.num_values
        baseData = Math.floor(baseData / prop.num_values)
        if (properties[prop.name]) {
          value = parseValue(properties[prop.name], prop)
        }
        data += offset * value
        offset *= prop.num_values
      }
      return data
    }
  }

  const blockInteractHandler = new Map()
  serv.interactWithBlock = async (data) => {
    const handler = blockInteractHandler.get(data.block.type)
    return handler ? handler(data) : false
  }

  /**
   * The handler is called when a player interact with a block
   * of the given type. Arguments are the block and the player
   * It should return true if the block placement should be
   * cancelled.
   */
  serv.onBlockInteraction = (name, handler) => {
    const block = registry.blocksByName[name]
    if (blockInteractHandler.has(block.id)) {
      serv.warn(`onBlockInteraction handler was registered twice for ${name}`)
    }
    blockInteractHandler.set(block.id, handler)
  }
}

module.exports.player = function (player, serv, { version }) {
  const registry = require('prismarine-registry')(version)
  const blocks = registry.blocks

  player._client.on('block_place', async ({ direction, location, cursorY } = {}) => {
    const referencePosition = new Vec3(location.x, location.y, location.z)
    const block = await player.world.getBlock(referencePosition)
    block.position = referencePosition
    block.direction = direction
    if (await serv.interactWithBlock({ block, player })) return
    if (player.gameMode >= 2) return

    const heldItem = player.inventory.slots[36 + player.heldItemSlot]
    if (!heldItem || direction === -1 || heldItem.type === -1) return

    const directionVector = block.boundingBox === 'empty' ? new Vec3(0, 0, 0) : directionToVector[direction]
    const placedPosition = referencePosition.plus(directionVector)
    if (placedPosition.equals(player.position.floored())) return
    const dx = player.position.x - (placedPosition.x + 0.5)
    const dz = player.position.z - (placedPosition.z + 0.5)
    const angle = Math.atan2(dx, -dz) * 180 / Math.PI + 180 // Convert to [0,360[

    if (registry.supportFeature('blockPlaceHasIntCursor')) cursorY /= 16

    let half = cursorY > 0.5 ? 'top' : 'bottom'
    if (direction === 0) half = 'top'
    else if (direction === 1) half = 'bottom'

    const { id, data } = await serv.placeItem({
      item: heldItem,
      angle,
      direction,
      player,
      referencePosition,
      placedPosition,
      directionVector,
      properties: {
        rotation: Math.floor(angle / 22.5 + 0.5) & 0xF,
        axis: directionToAxis[direction],
        facing: directionToFacing[Math.floor(angle / 90 + 0.5) & 0x3],
        half,
        waterlogged: (await player.world.getBlock(placedPosition)).type === registry.blocksByName.water.id
      }
    })

    if (!blocks[id]) return

    const sound = 'dig.' + (materialToSound[blocks[id].material] || 'stone')
    serv.playSound(sound, player.world, placedPosition.offset(0.5, 0.5, 0.5), {
      pitch: 0.8
    })

    if (player.gameMode === 0) {
      heldItem.count--
      if (heldItem.count === 0) {
        player.inventory.updateSlot(36 + player.heldItemSlot, null)
      } else {
        player.inventory.updateSlot(36 + player.heldItemSlot, heldItem)
      }
    }

    const stateId = registry.supportFeature('theFlattening') ? (blocks[id].minStateId + data) : (id << 4 | data)
    player.setBlock(placedPosition, stateId)
  })
}

const directionToVector = [new Vec3(0, -1, 0), new Vec3(0, 1, 0), new Vec3(0, 0, -1), new Vec3(0, 0, 1), new Vec3(-1, 0, 0), new Vec3(1, 0, 0)]
const directionToAxis = ['y', 'y', 'z', 'z', 'x', 'x']
const directionToFacing = ['north', 'east', 'south', 'west']
