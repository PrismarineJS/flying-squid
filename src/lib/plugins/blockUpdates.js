const { performance } = require('perf_hooks')

module.exports.server = (serv, { version }) => {
  const mcData = require('minecraft-data')(version)

  serv.MAX_UPDATES_PER_TICK = 10000

  // Each world has its own block update queue
  const worldUpdateQueue = new Map()

  // We eliminate redundant block updates at this level
  // by checking if the update is already in the queue.
  const addUpdate = (updateQueue, updateSet, update) => {
    const hash = update.pos + ',' + update.tick + ',' + update.forceNotify
    if (updateSet.has(hash)) return
    updateSet.add(hash)
    updateQueue.push(update)
  }

  serv.updateBlock = (world, pos, tick, forceNotify) => {
    // TODO: it would be better to know the list of loaded worlds at initialisation
    if (!worldUpdateQueue.has(world)) {
      worldUpdateQueue.set(world, { updateQueue: [], updateSet: new Set() })
    }
    const { updateQueue, updateSet } = worldUpdateQueue.get(world)
    addUpdate(updateQueue, updateSet, { pos, tick, forceNotify })
    // TODO: use a binary heap to keep track of updates
    updateQueue.sort((a, b) => a.tick - b.tick)
  }

  serv.notifyNeighborsOfStateChange = (world, pos, tick, forceNotify) => {
    // TODO: it would be better to know the list of loaded worlds at initialisation
    if (!worldUpdateQueue.has(world)) {
      worldUpdateQueue.set(world, { updateQueue: [], updateSet: new Set() })
    }
    const { updateQueue, updateSet } = worldUpdateQueue.get(world)
    addUpdate(updateQueue, updateSet, { pos: pos.offset(-1, 0, 0), tick, forceNotify }) // east
    addUpdate(updateQueue, updateSet, { pos: pos.offset(1, 0, 0), tick, forceNotify }) // west
    addUpdate(updateQueue, updateSet, { pos: pos.offset(0, -1, 0), tick, forceNotify }) // down
    addUpdate(updateQueue, updateSet, { pos: pos.offset(0, 1, 0), tick, forceNotify }) // up
    addUpdate(updateQueue, updateSet, { pos: pos.offset(0, 0, -1), tick, forceNotify }) // north
    addUpdate(updateQueue, updateSet, { pos: pos.offset(0, 0, 1), tick, forceNotify }) // south
    // TODO: use a binary heap to keep track of updates
    updateQueue.sort((a, b) => a.tick - b.tick)
  }

  serv.notifyNeighborsOfStateChangeDirectional = (world, pos, dir, tick, forceNotify) => {
    // TODO: it would be better to know the list of loaded worlds at initialisation
    if (!worldUpdateQueue.has(world)) {
      worldUpdateQueue.set(world, { updateQueue: [], updateSet: new Set() })
    }
    const { updateQueue, updateSet } = worldUpdateQueue.get(world)
    const p = pos.plus(dir)
    if (dir.x !== 1) addUpdate(updateQueue, updateSet, { pos: p.offset(-1, 0, 0), tick, forceNotify }) // east
    if (dir.x !== -1) addUpdate(updateQueue, updateSet, { pos: p.offset(1, 0, 0), tick, forceNotify }) // west
    if (dir.y !== 1) addUpdate(updateQueue, updateSet, { pos: p.offset(0, -1, 0), tick, forceNotify }) // down
    if (dir.y !== -1) addUpdate(updateQueue, updateSet, { pos: p.offset(0, 1, 0), tick, forceNotify }) // up
    if (dir.z !== 1) addUpdate(updateQueue, updateSet, { pos: p.offset(0, 0, -1), tick, forceNotify }) // north
    if (dir.z !== -1) addUpdate(updateQueue, updateSet, { pos: p.offset(0, 0, 1), tick, forceNotify }) // south
    // TODO: use a binary heap to keep track of updates
    updateQueue.sort((a, b) => a.tick - b.tick)
  }

  const updateHandlers = new Map()
  /**
   * The handler is called when a block of the given type is
   * updated. The argument are world, block and tick.
   * It should return true if the block changed its state
   */
  serv.onBlockUpdate = (name, handler) => {
    updateHandlers.set(mcData.blocksByName[name].id, handler)
  }

  serv.on('tick', async (tickTime, curTick) => {
    for (const [world, { updateQueue, updateSet }] of worldUpdateQueue.entries()) {
      const start = performance.now()
      let updatesCount = 0
      while (updatesCount < serv.MAX_UPDATES_PER_TICK && updateQueue.length > 0) {
        if (updateQueue[0].tick > curTick) break // We are done for this tick

        const { pos, tick, forceNotify } = updateQueue.shift()
        const hash = pos + ',' + tick + ',' + forceNotify
        updateSet.delete(hash)

        const block = await world.getBlock(pos)
        block.position = pos

        const handler = updateHandlers.get(block.type)
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
        updatesCount++
      }

      if (updatesCount > 0) {
        const time = (performance.now() - start) / 1000
        const fraction = (time * 100 / tickTime).toFixed(2)
        console.log(`[Block Update] Made ${updatesCount} updates, ${updateQueue.length} remainings (${fraction}% of tickTime)`)
      }
    }
  })
}
