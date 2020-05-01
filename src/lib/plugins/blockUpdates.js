module.exports.server = (serv, { version }) => {
  const mcData = require('minecraft-data')(version)
  
  serv.MAX_UPDATES_PER_TICK = 10000

  // Each world has its own block update queue
  const world_update_queue = new Map()

  // TODO: we could eliminate redundant block updates at this level
  // by checking if the update is already in the queue.

  serv.updateBlock = (world, pos, tick, forceNotify) => {
    // TODO: it would be better to know the list of loaded worlds at initialisation
    if (!world_update_queue.has(world)) {
      world_update_queue.set(world, [])
    }
    const update_queue = world_update_queue.get(world)
    update_queue.push({ pos, tick, forceNotify })
  }

  serv.notifyNeighborsOfStateChange = (world, pos, tick, forceNotify) => {
    // TODO: it would be better to know the list of loaded worlds at initialisation
    if (!world_update_queue.has(world)) {
      world_update_queue.set(world, [])
    }
    const update_queue = world_update_queue.get(world)
    update_queue.push({ pos: pos.offset( -1,  0,  0), tick, forceNotify }) // east
    update_queue.push({ pos: pos.offset(  1,  0,  0), tick, forceNotify }) // west
    update_queue.push({ pos: pos.offset(  0, -1,  0), tick, forceNotify }) // down
    update_queue.push({ pos: pos.offset(  0,  1,  0), tick, forceNotify }) // up
    update_queue.push({ pos: pos.offset(  0,  0, -1), tick, forceNotify }) // north
    update_queue.push({ pos: pos.offset(  0,  0,  1), tick, forceNotify }) // south
  }

  serv.notifyNeighborsOfStateChangeDirectional = (world, pos, dir, tick, forceNotify) => {
    // TODO: it would be better to know the list of loaded worlds at initialisation
    if (!world_update_queue.has(world)) {
      world_update_queue.set(world, [])
    }
    const update_queue = world_update_queue.get(world)
    const p = pos.plus(dir)
    update_queue.push({ pos: p, tick, forceNotify }) // center
    if (dir.x !==  1) update_queue.push({ pos: p.offset( -1,  0,  0), tick, forceNotify }) // east
    if (dir.x !== -1) update_queue.push({ pos: p.offset(  1,  0,  0), tick, forceNotify }) // west
    if (dir.y !==  1) update_queue.push({ pos: p.offset(  0, -1,  0), tick, forceNotify }) // down
    if (dir.y !== -1) update_queue.push({ pos: p.offset(  0,  1,  0), tick, forceNotify }) // up
    if (dir.z !==  1) update_queue.push({ pos: p.offset(  0,  0, -1), tick, forceNotify }) // north
    if (dir.z !== -1) update_queue.push({ pos: p.offset(  0,  0,  1), tick, forceNotify }) // south
  }

  const update_handlers = new Map()
  /**
   * The handler is called when a block of the given type is
   * updated. The argument are world, block and tick.
   * It should return true if the block changed its state
   */
  serv.onBlockUpdate = (name, handler) => {
    update_handlers.set(mcData.blocksByName[name].id, handler)
  }

  serv.on('tick', async (tickTime, curTick) => {
    for (const [world, update_queue] of world_update_queue.entries()) {
      let updates_count = 0
      while (updates_count < serv.MAX_UPDATES_PER_TICK && update_queue.length > 0) {
        // TODO: use a binary heap to keep track of updates
        update_queue.sort((a, b) => a.tick - b.tick)
        if (update_queue[0].tick > curTick) break // We are done for this tick
        const { pos, tick, forceNotify } = update_queue.shift()
        const block = await world.getBlock(pos)
        block.position = pos
        const handler = update_handlers.get(block.type)
        if (handler) {
          const changed = await handler(world, block, tick)
          if (changed) {
            const block = await world.getBlock(pos)
            // TODO: build multi block update packet
            serv.players
              .filter(p => p.world === world)
              .forEach(player => player.sendBlock(pos, block.type, block.metadata))
          } else if (forceNotify) {
            serv.notifyNeighborsOfStateChange(world, pos, tick)
          }
        } else if (forceNotify) {
          serv.notifyNeighborsOfStateChange(world, pos, tick)
        }
        updates_count++
      }

      if (updates_count > 0)
        console.log(`[Block Update] Made ${updates_count} updates, ${update_queue.length} remainings`)
    }
  })
}
