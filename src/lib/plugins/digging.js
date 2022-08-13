const Vec3 = require('vec3').Vec3

module.exports.player = function (player, serv, { version }) {
  const mcData = require('minecraft-data')(version)
  function cancelDig ({ position, block }) {
    player.sendBlock(position, block.type)
  }

  player._client.on('block_dig', async ({ location, status, face }) => {
    if (status === 3 || status === 4) {
      const heldItem = player.inventory.slots[36 + player.heldItemSlot]
      if (!heldItem || heldItem.type === -1) return

      const count = (status === 4) ? 1 : heldItem.count

      heldItem.count -= count
      if (heldItem.count === 0) player.inventory.slots[36 + player.heldItemSlot] = null

      // TODO: correct position & velocity + physic simulation
      dropBlock({
        blockDropPosition: player.position,
        blockDropWorld: player.world,
        blockDropVelocity: new Vec3(0, 0, 0),
        blockDropId: heldItem.type,
        blockDropDamage: heldItem.metadata,
        blockDropCount: count,
        blockDropPickup: 500,
        blockDropDeath: 60 * 5 * 1000
      })
    } else if (status === 5) {
      // TODO: Shoot arrow / finish eating
    } else if (status === 6) {
      const currentSlot = player.inventory.slots[36 + player.heldItemSlot]
      const offhand = player.inventory.slots[45]

      player.inventory.updateSlot(36 + player.heldItemSlot, offhand)
      player.inventory.updateSlot(45, currentSlot)
    } else {
      let pos = new Vec3(location.x, location.y, location.z)

      const directionVector = directionToVector[face]
      const facedPos = pos.plus(directionVector)

      const facedBlock = await player.world.getBlock(facedPos)
      let block
      if (facedBlock.name === 'fire') {
        block = facedBlock
        pos = facedPos
      } else {
        block = await player.world.getBlock(pos)
      }

      currentlyDugBlock = block
      if (currentlyDugBlock.type === 0) return
      if (status === 0) {
        if (player.gameMode === 1) {
          creativeDigging(pos)
        } else {
          startDigging(pos)
        }
      } else if (status === 1 || player.gameMode >= 2) {
        cancelDigging(pos)
      } else if (status === 2) {
        completeDigging(pos)
      }
    }
  })

  function diggingTime () {
    // assume holding nothing and usual conditions
    return currentlyDugBlock.digTime(null, false, false, false)
  }

  let currentlyDugBlock
  let startDiggingTime
  let animationInterval
  let expectedDiggingTime
  let lastDestroyState
  let currentAnimationId
  function startDigging (location) {
    serv.entityMaxId++
    currentAnimationId = serv.entityMaxId
    expectedDiggingTime = diggingTime(location)
    lastDestroyState = 0
    startDiggingTime = new Date()
    updateAnimation()
    animationInterval = setInterval(updateAnimation, 100)
    function updateAnimation () {
      const currentDiggingTime = new Date() - startDiggingTime
      let newDestroyState = Math.floor(9 * currentDiggingTime / expectedDiggingTime)
      newDestroyState = newDestroyState > 9 ? 9 : newDestroyState
      if (newDestroyState !== lastDestroyState) {
        player.behavior('breakAnimation', {
          lastState: lastDestroyState,
          state: newDestroyState,
          start: startDigging,
          timePassed: currentDiggingTime,
          position: location
        }, ({ state }) => {
          lastDestroyState = state
          player._writeOthersNearby('block_break_animation', {
            entityId: currentAnimationId,
            location,
            destroyStage: state
          })
        })
      }
    }
    if (serv.supportFeature('acknowledgePlayerDigging')) {
      player._client.write('acknowledge_player_digging', {
        location,
        block: currentlyDugBlock.stateId,
        status: 0,
        successful: true
      })
    }
  }

  function cancelDigging (location) {
    clearInterval(animationInterval)
    player._writeOthersNearby('block_break_animation', {
      entityId: currentAnimationId,
      location,
      destroyStage: -1
    })
    if (serv.supportFeature('acknowledgePlayerDigging')) {
      player._client.write('acknowledge_player_digging', {
        location,
        block: currentlyDugBlock.stateId,
        status: 1,
        successful: true
      })
    }
  }

  async function completeDigging (location) {
    clearInterval(animationInterval)
    const diggingTime = new Date() - startDiggingTime
    let stop = false
    if (expectedDiggingTime - diggingTime < 100) {
      stop = player.behavior('forceCancelDig', {
        stop: true,
        start: startDiggingTime,
        time: diggingTime
      }).stop
    }
    if (!stop) {
      const drops = []
      const dropBase = {
        blockDropPosition: location.offset(0.5, 0.5, 0.5),
        blockDropWorld: player.world,
        blockDropDamage: currentlyDugBlock.metadata,
        blockDropPickup: 500,
        blockDropDeath: 60 * 5 * 1000
      }
      if (typeof mcData.blockLoot === 'undefined') {
        drops.push({
          ...dropBase,
          blockDropVelocity: new Vec3(Math.random() * 4 - 2, Math.random() * 2 + 2, Math.random() * 4 - 2),
          blockDropId: serv.supportFeature('theFlattening') ? currentlyDugBlock.drops[0] : currentlyDugBlock.type
        })
      } else {
        const heldItem = player.inventory.slots[36 + player.heldItemSlot]
        const silkTouch = heldItem?.enchants.map(enchant => enchant.name).includes('silk_touch')
        const blockDrops = mcData.blockLoot[currentlyDugBlock.name].drops.filter(drop => !(drop[`${silkTouch ? 'noS' : 's'}ilkTouch`] ?? false))
        for (const drop of blockDrops) {
          drops.push({
            ...dropBase,
            blockDropVelocity: new Vec3(Math.random() * 4 - 2, Math.random() * 2 + 2, Math.random() * 4 - 2),
            blockDropId: mcData.itemsByName[drop.item].id
          })
        }
      }
      player.behavior('dug', {
        position: location,
        block: currentlyDugBlock,
        dropBlock: true,
        drops
      }, async (data) => {
        player.changeBlock(data.position, 0, 0)
        const aboveBlock = await player.world.getBlock(data.position.offset(0, 1, 0))
        if (aboveBlock.material === 'plant') {
          await player.setBlock(data.position.offset(0, 1, 0), 0, 0)
        }
        if (data.dropBlock) {
          drops.forEach(drop => dropBlock(drop))
        }
        if (serv.supportFeature('acknowledgePlayerDigging')) {
          player._client.write('acknowledge_player_digging', {
            location,
            block: 0,
            status: 2,
            successful: true
          })
        }
      }, cancelDig)
    } else {
      player._client.write('block_change', {
        location,
        type: currentlyDugBlock.type << 4
      })
      if (serv.supportFeature('acknowledgePlayerDigging')) {
        player._client.write('acknowledge_player_digging', {
          location,
          block: currentlyDugBlock.stateId,
          status: 2,
          successful: false
        })
      }
    }
  }

  function dropBlock ({ blockDropPosition, blockDropWorld, blockDropVelocity, blockDropId, blockDropDamage, blockDropCount, blockDropPickup, blockDropDeath }) {
    serv.spawnObject(mcData.entitiesByName[mcData.version['<']('1.11') ? 'Item' : 'item'].id, blockDropWorld, blockDropPosition, {
      velocity: blockDropVelocity,
      itemId: blockDropId,
      itemDamage: blockDropDamage,
      itemCount: blockDropCount,
      pickupTime: blockDropPickup,
      deathTime: blockDropDeath
    })
  }

  function creativeDigging (location) {
    player.behavior('dug', {
      position: location,
      block: currentlyDugBlock,
      dropBlock: false,
      blockDropPosition: location.offset(0.5, 0.5, 0.5),
      blockDropWorld: player.world,
      blockDropVelocity: new Vec3(Math.random() * 4 - 2, Math.random() * 2 + 2, Math.random() * 4 - 2),
      blockDropId: currentlyDugBlock.type,
      blockDropDamage: currentlyDugBlock.metadata,
      blockDropPickup: 500,
      blockDropDeath: 60 * 5 * 1000
    }, async (data) => {
      player.changeBlock(data.position, 0, 0)
      const aboveBlock = await player.world.getBlock(data.position.offset(0, 1, 0))
      if (aboveBlock.material === 'plant') {
        await player.setBlock(data.position.offset(0, 1, 0), 0, 0)
      }
      if (data.dropBlock) dropBlock(data)
    }, cancelDig)
  }
}

const directionToVector = [new Vec3(0, -1, 0), new Vec3(0, 1, 0), new Vec3(0, 0, -1), new Vec3(0, 0, 1), new Vec3(-1, 0, 0), new Vec3(1, 0, 0)]
