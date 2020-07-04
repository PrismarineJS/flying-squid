const Vec3 = require('vec3').Vec3

module.exports.server = function (serv, { version }) {
  const mcData = require('minecraft-data')(version)

  const redstoneWireType = mcData.blocksByName.redstone_wire.id
  const redstoneTorchType = mcData.blocksByName.redstone_torch.id

  let poweredRepeaterType, unpoweredRepeaterType, unlitRedstoneTorchType, repeaterType
  if (!serv.supportFeature('theFlattening')) {
    unlitRedstoneTorchType = mcData.blocksByName.unlit_redstone_torch.id
    poweredRepeaterType = mcData.blocksByName.powered_repeater.id
    unpoweredRepeaterType = mcData.blocksByName.unpowered_repeater.id
  } else { repeaterType = mcData.blocksByName.repeater.id }
  const powerLevel = (block, dir) => {
    if (block.type === redstoneWireType) return block.metadata
    if (block.type === redstoneTorchType) return 15
    if (serv.supportFeature('theFlattening')) {
      // to do
    } else {
      // the if below is missing a check whether repeater is powered or not
      if (block.type === poweredRepeaterType) {
        const dataDir = block.metadata & 0x3
        if (dataDir === 0 && dir.z === 1) return 15
        if (dataDir === 1 && dir.x === -1) return 15
        if (dataDir === 2 && dir.z === -1) return 15
        if (dataDir === 3 && dir.x === 1) return 15
      }
    }
    return 0
  }

  // Return the power level from the block at pos to the solid block in dir
  const powerLevelDir = async (world, pos, dir) => {
    const block = await world.getBlock(pos)
    if (dir.y === -1 && block.type === redstoneTorchType) return 15
    if (block.type === redstoneWireType) {
      if (dir.y === 1 || await isWireDirectedIn(world, pos, dir.scaled(-1))) { return block.metadata }
    }
    if (serv.supportFeature('theFlattening')) {
      // to-do
    } else {
      if (block.type === poweredRepeaterType) {
        const dataDir = block.metadata & 0x3
        if (dataDir === 0 && dir.z === 1) return 15
        if (dataDir === 1 && dir.x === -1) return 15
        if (dataDir === 2 && dir.z === -1) return 15
        if (dataDir === 3 && dir.x === 1) return 15
      }
    }
    return 0
  }

  const isWireDirectedIn = async (world, pos, dir) => {
    const up = await world.getBlock(pos.offset(0, 1, 0))
    const upSolid = isSolid(up)
    const b1 = (await wireDirection(world, pos, new Vec3(-dir.x, 0, -dir.z), upSolid)).block !== null
    const b2 = (await wireDirection(world, pos, new Vec3(dir.z, 0, dir.x), upSolid)).block !== null
    const b3 = (await wireDirection(world, pos, new Vec3(-dir.z, 0, -dir.x), upSolid)).block !== null
    return b1 && !(b2 || b3)
  }

  const isSolid = (block) => {
    return block.boundingBox === 'block'
  }

  const isWire = (block) => {
    return block.type === redstoneWireType
  }

  const isRedstone = (block) => {
    return block.type === redstoneWireType ||
           block.type === redstoneTorchType ||
           block.type === unlitRedstoneTorchType
  }

  const isDirectedRepeater = (block, dir, powered = false) => {
    if (serv.supportFeature('theFlattening')) {
      // TO-DO
      return false
    } else {
      if (block.type !== poweredRepeaterType &&
        (block.type !== unpoweredRepeaterType || powered)) return false
      const dataDir = block.metadata & 0x3
      if ((dataDir === 0 || dataDir === 2) && Math.abs(dir.z) === 1) return true
      if ((dataDir === 1 || dataDir === 3) && Math.abs(dir.x) === 1) return true
      return false
    }
  }

  const wireDirection = async (world, pos, dir, upSolid) => {
    pos = pos.plus(dir)
    const blockA = await world.getBlock(pos)
    blockA.position = pos
    const blockB = await world.getBlock(pos.offset(0, -1, 0))
    blockB.position = pos.offset(0, -1, 0)
    const blockC = await world.getBlock(pos.offset(0, 1, 0))
    blockC.position = pos.offset(0, 1, 0)
    if (isRedstone(blockA) || isDirectedRepeater(blockA, dir)) { // same y
      return { power: powerLevel(blockA, dir), block: blockA }
    }
    if (!isSolid(blockA) && isWire(blockB)) { // down
      return { power: powerLevel(blockB, dir), block: blockB }
    }
    if (!upSolid && isWire(blockC)) { // up
      return { power: powerLevel(blockC, dir), block: blockC }
    }
    return { power: 0, block: null }
  }

  const notifyEndOfLine = async (world, pos, dir, tick) => {
    const blockPos = pos.plus(dir)
    const block = await world.getBlock(blockPos)
    if (isSolid(block) && await isWireDirectedIn(world, pos, dir)) {
      serv.updateBlock(world, blockPos, tick, tick)
      serv.notifyNeighborsOfStateChangeDirectional(world, pos, dir, tick, tick)
    }
  }

  serv.on('asap', () => {
    serv.onItemPlace('redstone', () => {
      return { id: redstoneWireType, data: 0 }
    })

    serv.onItemPlace('redstone_torch', ({ direction }) => {
      const directionToData = [0, 5, 4, 3, 2, 1]
      // Placing an unlit torch allows to detect change on the first update
      // and reduce the block updates
      return { id: unlitRedstoneTorchType, data: directionToData[direction] }
    })

    serv.onItemPlace('repeater', ({ angle }) => {
      return { id: unpoweredRepeaterType, data: Math.floor(angle / 90 + 0.5) & 0x3 }
    })

    const repeaterInteraction = async ({ block, player }) => {
      const data = (block.metadata + 4) & 0xF
      player.setBlock(block.position, block.type, data)
      return true
    }
    if (!serv.supportFeature('theFlattening')) {
      serv.onBlockInteraction('powered_repeater', repeaterInteraction)
      serv.onBlockInteraction('unpowered_repeater', repeaterInteraction)
    }

    const torchDataToOffset = [null, new Vec3(-1, 0, 0), new Vec3(1, 0, 0), new Vec3(0, 0, -1), new Vec3(0, 0, 1), new Vec3(0, -1, 0)]

    const updateRedstoneTorch = async (world, block, fromTick, tick, data) => {
      const offset = torchDataToOffset[block.metadata]
      const pos = block.position

      // Redstone torch should be attached to a solid block
      const support = await world.getBlock(pos.plus(offset))
      support.position = pos.plus(offset)
      if (support.boundingBox !== 'block') {
        await world.setBlockStateId(pos, 0)
        // TODO: drop torch
        serv.notifyNeighborsOfStateChange(world, pos, tick, tick, true)
        return true
      }

      let p = await powerLevelDir(world, support.position.offset(0, -1, 0), new Vec3(0, -1, 0))
      if (block.metadata !== 1) p = Math.max(p, await powerLevelDir(world, support.position.offset(1, 0, 0), new Vec3(1, 0, 0)))
      if (block.metadata !== 2) p = Math.max(p, await powerLevelDir(world, support.position.offset(-1, 0, 0), new Vec3(-1, 0, 0)))
      if (block.metadata !== 3) p = Math.max(p, await powerLevelDir(world, support.position.offset(0, 0, 1), new Vec3(0, 0, 1)))
      if (block.metadata !== 4) p = Math.max(p, await powerLevelDir(world, support.position.offset(0, 0, -1), new Vec3(0, 0, -1)))
      if (block.metadata !== 5) p = Math.max(p, await powerLevelDir(world, support.position.offset(0, 1, 0), new Vec3(0, 1, 0)))

      let changed = false
      if (block.type === redstoneTorchType && p !== 0) {
        await world.setBlockType(pos, unlitRedstoneTorchType)
        changed = true
      } else if (block.type === unlitRedstoneTorchType && p === 0) {
        await world.setBlockType(pos, redstoneTorchType)
        changed = true
      }

      if (changed) {
        if (block.metadata === 1) serv.notifyNeighborsOfStateChangeDirectional(world, pos.offset(-1, 0, 0), new Vec3(1, 0, 0), tick, tick + 1)
        if (block.metadata === 2) serv.notifyNeighborsOfStateChangeDirectional(world, pos.offset(1, 0, 0), new Vec3(-1, 0, 0), tick, tick + 1)
        if (block.metadata === 3) serv.notifyNeighborsOfStateChangeDirectional(world, pos.offset(0, 0, -1), new Vec3(0, 0, 1), tick, tick + 1)
        if (block.metadata === 4) serv.notifyNeighborsOfStateChangeDirectional(world, pos.offset(0, 0, 1), new Vec3(0, 0, -1), tick, tick + 1)
        if (block.metadata === 5) serv.notifyNeighborsOfStateChangeDirectional(world, pos.offset(0, -1, 0), new Vec3(0, 1, 0), tick, tick + 1)
        if (isSolid(await world.getBlock(pos.offset(0, 1, 0)))) {
          serv.notifyNeighborsOfStateChangeDirectional(world, pos, new Vec3(0, 1, 0), tick, tick + 1)
        }
      }

      return changed
    }
    if (!serv.supportFeature('theFlattening')) {
      serv.onBlockUpdate('unlit_redstone_torch', updateRedstoneTorch)
    }
    serv.onBlockUpdate('redstone_torch', updateRedstoneTorch)

    const repeaterDirection = [new Vec3(0, 0, 1), new Vec3(-1, 0, 0), new Vec3(0, 0, -1), new Vec3(1, 0, 0)]

    const updateRepeater = async (world, block, fromTick, tick, data) => {
      const pos = block.position

      // Redstone repeater should be on a solid block
      const support = await world.getBlock(pos.offset(0, -1, 0))
      if (support.boundingBox !== 'block') {
        await world.setBlockStateId(pos, 0)
        // TODO: drop repeater
        serv.notifyNeighborsOfStateChange(world, pos, tick, tick)
        return true
      }

      const dir = repeaterDirection[block.metadata & 0x3]
      const source = await world.getBlock(pos.plus(dir))
      const curPower = block.type === poweredRepeaterType || block.type === repeaterType ? 15 : 0
      let p = powerLevel(source, dir)

      const sideA = await world.getBlock(pos.offset(dir.z, 0, dir.x))
      const sideB = await world.getBlock(pos.offset(-dir.z, 0, -dir.x))
      const isLocked = isDirectedRepeater(sideA, new Vec3(dir.z, 0, dir.x), true) ||
                       isDirectedRepeater(sideB, new Vec3(-dir.z, 0, -dir.x), true)

      // Source power didn't change or locked, do nothing
      if ((p === 0) === (curPower === 0) || isLocked) return false

      if (data !== null) p = data // load old value of p

      const delay = (((block.metadata >> 2) & 0x3) + 1) * 2 // delay in game tick
      if (delay > (tick - fromTick)) { // Too soon, reschedule for later
        serv.updateBlock(world, pos, fromTick, fromTick + delay, false, p)
        if (p !== 0) { // on-pulse
          for (let t = 1; t < delay; t++) { // blacklist next ticks
            serv.updateBlock(world, pos, fromTick, fromTick + delay + t, false, p)
          }
        }
        return false
      }

      let changed = false
      if ((block.type === poweredRepeaterType || block.type === repeaterType) && p === 0) {
        if (serv.supportFeature('theFlattening')) { block.metadata.powered = false } else { await world.setBlockType(pos, unpoweredRepeaterType) }
        changed = true
      } else if ((block.type === unpoweredRepeaterType || block.type === repeaterType) && p !== 0) {
        if (serv.supportFeature('theFlattening')) { block.metadata.powered = true } else { await world.setBlockType(pos, poweredRepeaterType) }
        changed = true
      }

      if (changed) {
        serv.updateBlock(world, pos.plus(dir.scaled(-1)), tick, tick)
        const sink = await world.getBlock(pos.plus(dir.scaled(-1)))
        if (isSolid(sink)) { serv.notifyNeighborsOfStateChangeDirectional(world, pos, dir.scaled(-1), tick, tick) }
      }

      return changed
    }
    if (!serv.supportFeature('theFlattening')) {
      serv.onBlockUpdate('powered_repeater', updateRepeater)
      serv.onBlockUpdate('unpowered_repeater', updateRepeater)
    }

    serv.onBlockUpdate('redstone_wire', async (world, block, fromTick, tick, data) => {
      const pos = block.position

      // Redstone wire should be on a solid block
      const support = await world.getBlock(pos.offset(0, -1, 0))
      if (support.boundingBox !== 'block') {
        await world.setBlockStateId(pos, 0)
        // TODO: drop redstone
        serv.notifyNeighborsOfStateChange(world, pos, tick, tick)
        return true
      }

      const up = await world.getBlock(pos.offset(0, 1, 0))
      const upSolid = isSolid(up)

      const b1 = await wireDirection(world, pos, new Vec3(-1, 0, 0), upSolid)
      const b2 = await wireDirection(world, pos, new Vec3(1, 0, 0), upSolid)
      const b3 = await wireDirection(world, pos, new Vec3(0, 0, -1), upSolid)
      const b4 = await wireDirection(world, pos, new Vec3(0, 0, 1), upSolid)

      const maxPower = Math.max(Math.max(b1.power, b2.power), Math.max(b3.power, b4.power))
      const curPower = block.metadata
      const newPower = Math.max(0, maxPower - 1)
      const changed = curPower !== newPower

      if (changed) {
        // The power level has changed we update the block state
        await world.setBlockData(pos, newPower)

        // Redstone wires neighbors:
        if (b1.block) serv.updateBlock(world, b1.block.position, tick, tick)
        if (b2.block) serv.updateBlock(world, b2.block.position, tick, tick)
        if (b3.block) serv.updateBlock(world, b3.block.position, tick, tick)
        if (b4.block) serv.updateBlock(world, b4.block.position, tick, tick)

        // Block updates
        // Only update if there is a real state change (powered / not powered)
        if ((curPower === 0) !== (newPower === 0)) {
          serv.updateBlock(world, pos.offset(0, -1, 0), tick, tick)
          serv.notifyNeighborsOfStateChangeDirectional(world, pos, new Vec3(0, -1, 0), tick, tick)
        }
      }

      // The end of line updates are always triggered because the direction is not encoded in the state
      // (so we cannot detect the change)
      await notifyEndOfLine(world, pos, new Vec3(1, 0, 0), tick + 1)
      await notifyEndOfLine(world, pos, new Vec3(-1, 0, 0), tick + 1)
      await notifyEndOfLine(world, pos, new Vec3(0, 0, 1), tick + 1)
      await notifyEndOfLine(world, pos, new Vec3(0, 0, -1), tick + 1)

      return changed
    })
  })
}
