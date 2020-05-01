const Vec3 = require('vec3').Vec3

module.exports.server = function (serv, { version }) {
  const mcData = require('minecraft-data')(version)

  const redstoneWireType = mcData.blocksByName.redstone_wire.id
  const redstoneTorchType = mcData.blocksByName.redstone_torch.id
  const unlitRedstoneTorchType = mcData.blocksByName.unlit_redstone_torch.id

  const powerLevel = (block) => {
    if (block.type === redstoneWireType) return block.metadata
    if (block.type === redstoneTorchType) return 15
    return 0
  }

  // Return the power level from the block at pos to the solid block in dir
  const powerLevelDir = async (world, pos, dir) => {
    const block = await world.getBlock(pos)
    if (dir.y === 1 && block.type === redstoneTorchType) return 15
    if (block.type === redstoneWireType) {
      if (dir.y === -1) return block.metadata
      return block.metadata // TODO: isDirected into block
    }
    return 0
  }

  const isSolid = (block) => {
    return block.boundingBox === 'block'
  }

  const isWire = (block) => {
    return block.type === redstoneWireType
  }

  const isRedstone = (block) => {
    return block.type === redstoneWireType || block.type === redstoneTorchType || block.type === unlitRedstoneTorchType
  }

  const wireDirection = async (world, pos, upSolid) => {
    const blockA = await world.getBlock(pos)
    blockA.position = pos
    const blockB = await world.getBlock(pos.offset(0, -1, 0))
    blockB.position = pos.offset(0, -1, 0)
    const blockC = await world.getBlock(pos.offset(0, 1, 0))
    blockC.position = pos.offset(0, 1, 0)
    if (isSolid(blockB) && isRedstone(blockA)) { // same y
      return { power: powerLevel(blockA), block: blockA }
    }
    if (!isSolid(blockA) && isWire(blockB)) { // down
      return { power: powerLevel(blockB), block: blockB }
    }
    if (!upSolid && isWire(blockC)) { // up
      return { power: powerLevel(blockC), block: blockC }
    }
    return { power: 0, block: null }
  }

  serv.on('asap', () => {
    serv.onItemPlace('redstone', (item, direction) => {
      return { id: redstoneWireType, data: 0 }
    })

    serv.onItemPlace('redstone_torch', (item, direction) => {
      const directionToData = [0, 5, 4, 3, 2, 1]
      return { id: redstoneTorchType, data: directionToData[direction] }
    })

    const torchDataToOffset = [null, new Vec3(-1, 0, 0), new Vec3(1, 0, 0), new Vec3(0, 0, -1), new Vec3(0, 0, 1), new Vec3(0, -1, 0)]

    const updateRedstoneTorch = async (world, block, tick) => {
      const offset = torchDataToOffset[block.metadata]
      const pos = block.position

      // Redstone torch should be attached to a solid block
      const support = await world.getBlock(pos.plus(offset))
      support.position = pos.plus(offset)
      if (support.boundingBox !== 'block') {
        await world.setBlockType(pos, 0)
        await world.setBlockData(pos, 0)
        // TODO: drop torch
        serv.notifyNeighborsOfStateChange(world, pos, tick, true)
        return true
      }

      let p = await powerLevelDir(world, support.position.offset(0, -1, 0), new Vec3(0, 1, 0))
      if (block.metadata !== 1) p = Math.max(p, await powerLevelDir(world, support.position.offset(1, 0, 0), new Vec3(-1, 0, 0)))
      if (block.metadata !== 2) p = Math.max(p, await powerLevelDir(world, support.position.offset(-1, 0, 0), new Vec3(1, 0, 0)))
      if (block.metadata !== 3) p = Math.max(p, await powerLevelDir(world, support.position.offset(0, 0, 1), new Vec3(0, 0, -1)))
      if (block.metadata !== 4) p = Math.max(p, await powerLevelDir(world, support.position.offset(0, 0, -1), new Vec3(0, 0, 1)))
      if (block.metadata !== 5) p = Math.max(p, await powerLevelDir(world, support.position.offset(0, 1, 0), new Vec3(0, -1, 0)))

      let changed = false
      if (block.type === redstoneTorchType && p !== 0) {
        await world.setBlockType(pos, unlitRedstoneTorchType)
        changed = true
      } else if (block.type === unlitRedstoneTorchType && p === 0) {
        await world.setBlockType(pos, redstoneTorchType)
        changed = true
      }

      if (block.metadata === 1) serv.notifyNeighborsOfStateChangeDirectional(world, pos.offset(-1, 0, 0), new Vec3(1, 0, 0), tick + 1)
      if (block.metadata === 2) serv.notifyNeighborsOfStateChangeDirectional(world, pos.offset(1, 0, 0), new Vec3(-1, 0, 0), tick + 1)
      if (block.metadata === 3) serv.notifyNeighborsOfStateChangeDirectional(world, pos.offset(0, 0, -1), new Vec3(0, 0, 1), tick + 1)
      if (block.metadata === 4) serv.notifyNeighborsOfStateChangeDirectional(world, pos.offset(0, 0, 1), new Vec3(0, 0, -1), tick + 1)
      if (block.metadata === 5) serv.notifyNeighborsOfStateChangeDirectional(world, pos.offset(0, -1, 0), new Vec3(0, 1, 0), tick + 1)
      serv.notifyNeighborsOfStateChangeDirectional(world, pos, new Vec3(0, 1, 0), tick + 1)
      // TODO: eliminate the 1 redundant block update

      return changed
    }
    serv.onBlockUpdate('redstone_torch', updateRedstoneTorch)
    serv.onBlockUpdate('unlit_redstone_torch', updateRedstoneTorch)

    serv.onBlockUpdate('redstone_wire', async (world, block, tick) => {
      const pos = block.position

      // Redstone wire should be on a solid block
      const support = await world.getBlock(pos.offset(0, -1, 0))
      if (support.boundingBox !== 'block') {
        await world.setBlockType(pos, 0)
        await world.setBlockData(pos, 0)
        // TODO: drop redstone
        serv.notifyNeighborsOfStateChange(world, pos, tick)
        return true
      }

      const up = await world.getBlock(pos.offset(0, 1, 0))
      const upSolid = isSolid(up)

      const b1 = await wireDirection(world, pos.offset(-1, 0, 0), upSolid)
      const b2 = await wireDirection(world, pos.offset(1, 0, 0), upSolid)
      const b3 = await wireDirection(world, pos.offset(0, 0, -1), upSolid)
      const b4 = await wireDirection(world, pos.offset(0, 0, 1), upSolid)

      const maxPower = Math.max(Math.max(b1.power, b2.power), Math.max(b3.power, b4.power))
      const curPower = block.metadata
      const newPower = Math.max(0, maxPower - 1)
      const changed = curPower !== newPower

      if (changed) {
        // The power level has changed we update the block state
        await world.setBlockData(pos, newPower)

        // Redstone wires neighbors:
        // Only update folowing the power gradient
        const dP = Math.sign(newPower - curPower)
        if (b1.block && Math.sign(b1.power - curPower) === dP) serv.updateBlock(world, b1.block.position, tick)
        if (b2.block && Math.sign(b2.power - curPower) === dP) serv.updateBlock(world, b2.block.position, tick)
        if (b3.block && Math.sign(b3.power - curPower) === dP) serv.updateBlock(world, b3.block.position, tick)
        if (b4.block && Math.sign(b4.power - curPower) === dP) serv.updateBlock(world, b4.block.position, tick)

        // Block updates
        // Only update if there is a real state change (powered / not powered)
        if ((curPower === 0) !== (newPower === 0)) {
          serv.notifyNeighborsOfStateChange(world, pos, tick, true) // TODO: this is too many updates, but will do for now
        }
      }

      return changed
    })
  })
}
