const Vec3 = require('vec3').Vec3

module.exports.player = function (player, serv) {
  function cancelDig ({ position, block }) {
    player.sendBlock(position, block.type, block.metadata)
  }

  player._client.on('block_dig', async ({ location, status, face }) => {
    let pos = new Vec3(location.x, location.y, location.z)

    const directionVector = directionToVector[face]
    const facedPos = pos.plus(directionVector)

    try {
      const facedBlock = await player.world.getBlock(facedPos)
      let block
      if (facedBlock.name === 'fire') {
        block = facedBlock
        pos = facedPos
      } else block = await player.world.getBlock(pos)

      currentlyDugBlock = block
      if (currentlyDugBlock.type === 0) return
      if (status === 0 && player.gameMode !== 1) {
        player.behavior('dig', { // Start dig survival
          position: pos,
          block: block
        }, ({ position }) => {
          return startDigging(position)
        }, cancelDig)
      } else if (status === 2) { completeDigging(pos) } else if (status === 1) {
        player.behavior('cancelDig', { // Cancel dig survival
          position: pos,
          block: block
        }, ({ position }) => {
          return cancelDigging(position)
        })
      } else if (status === 0 && player.gameMode === 1) { return creativeDigging(pos) }
    } catch (err) {
      setTimeout(() => { throw err }, 0)
    }
  })

  function diggingTime () {
    // assume holding nothing and usual conditions
    return currentlyDugBlock.digTime()
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
            'entityId': currentAnimationId,
            'location': location,
            'destroyStage': state
          })
        })
      }
    }
  }

  function cancelDigging (location) {
    clearInterval(animationInterval)
    player._writeOthersNearby('block_break_animation', {
      'entityId': currentAnimationId,
      'location': location,
      'destroyStage': -1
    })
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
      player.behavior('dug', {
        position: location,
        block: currentlyDugBlock,
        dropBlock: true,
        blockDropPosition: location.offset(0.5, 0.5, 0.5),
        blockDropWorld: player.world,
        blockDropVelocity: new Vec3(Math.random() * 4 - 2, Math.random() * 2 + 2, Math.random() * 4 - 2),
        blockDropId: currentlyDugBlock.type,
        blockDropDamage: currentlyDugBlock.metadata,
        blockDropPickup: 500,
        blockDropDeath: 60 * 5 * 1000
      }, (data) => {
        player.changeBlock(data.position, 0, 0)
        if (data.dropBlock) dropBlock(data)
      }, cancelDig)
    } else {
      player._client.write('block_change', {
        location: location,
        type: currentlyDugBlock.type << 4
      })
    }
  }

  function dropBlock ({ blockDropPosition, blockDropWorld, blockDropVelocity, blockDropId, blockDropDamage, blockDropPickup, blockDropDeath }) {
    serv.spawnObject(2, blockDropWorld, blockDropPosition, {
      velocity: blockDropVelocity,
      itemId: blockDropId,
      itemDamage: blockDropDamage,
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
    }, (data) => {
      player.changeBlock(data.position, 0, 0)
      if (data.dropBlock) dropBlock(data)
    }, cancelDig)
  }
}

const directionToVector = [new Vec3(0, -1, 0), new Vec3(0, 1, 0), new Vec3(0, 0, -1), new Vec3(0, 0, 1), new Vec3(-1, 0, 0), new Vec3(1, 0, 0)]
