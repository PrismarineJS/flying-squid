const { performance } = require('perf_hooks')

class ChunkUpdates {
  constructor () {
    this.chunks = new Map()
  }

  add (pos) {
    const chunkX = Math.floor(pos.x / 16)
    const chunkZ = Math.floor(pos.z / 16)
    const key = `${chunkX},${chunkZ}`
    if (!this.chunks.has(key)) {
      this.chunks.set(key, { chunkX, chunkZ, updates: new Set() })
    }
    this.chunks.get(key).updates.add(pos)
  }

  updateCount () {
    let count = 0
    for (const { updates } of this.chunks.values()) {
      count += updates.size
    }
    return count
  }

  async getMultiBlockPackets (world) {
    const packets = []
    for (const { chunkX, chunkZ, updates } of this.chunks.values()) {
      const records = []
      for (const p of updates.values()) {
        const state = await world.getBlockStateId(p)
        records.push({
          horizontalPos: ((p.x & 0xF) << 4) | (p.z & 0xF),
          y: p.y,
          blockId: state
        })
      }
      packets.push({ chunkX, chunkZ, records })
    }
    return packets
  }
}

module.exports.server = (serv, { version }) => {
  const mcData = require('minecraft-data')(version)

  serv.MAX_UPDATES_PER_TICK = 10000

  // Each world has its own block update queue
  const worldUpdateQueue = new Map()

  // We eliminate redundant block updates at this level
  // by checking if the update is already in the queue.
  const addUpdate = (updateQueue, updateSet, update) => {
    const hash = update.pos + ',' + update.fromTick + ',' + update.tick + ',' + update.forceNotify
    if (updateSet.has(hash)) return
    updateSet.add(hash)
    updateQueue.push(update)
  }

  serv.updateBlock = (world, pos, fromTick, tick, forceNotify = false, data = null) => {
    // TODO: it would be better to know the list of loaded worlds at initialisation
    if (!worldUpdateQueue.has(world)) {
      worldUpdateQueue.set(world, { updateQueue: [], updateSet: new Set() })
    }
    const { updateQueue, updateSet } = worldUpdateQueue.get(world)
    addUpdate(updateQueue, updateSet, { pos, fromTick, tick, forceNotify, data })
    // TODO: use a binary heap to keep track of updates
    updateQueue.sort((a, b) => a.tick - b.tick)
  }

  serv.notifyNeighborsOfStateChange = (world, pos, fromTick, tick, forceNotify = false, data = null) => {
    // TODO: it would be better to know the list of loaded worlds at initialisation
    if (!worldUpdateQueue.has(world)) {
      worldUpdateQueue.set(world, { updateQueue: [], updateSet: new Set() })
    }
    const { updateQueue, updateSet } = worldUpdateQueue.get(world)
    addUpdate(updateQueue, updateSet, { pos: pos.offset(-1, 0, 0), fromTick, tick, forceNotify, data }) // east
    addUpdate(updateQueue, updateSet, { pos: pos.offset(1, 0, 0), fromTick, tick, forceNotify, data }) // west
    addUpdate(updateQueue, updateSet, { pos: pos.offset(0, -1, 0), fromTick, tick, forceNotify, data }) // down
    addUpdate(updateQueue, updateSet, { pos: pos.offset(0, 1, 0), fromTick, tick, forceNotify, data }) // up
    addUpdate(updateQueue, updateSet, { pos: pos.offset(0, 0, -1), fromTick, tick, forceNotify, data }) // north
    addUpdate(updateQueue, updateSet, { pos: pos.offset(0, 0, 1), fromTick, tick, forceNotify, data }) // south
    // TODO: use a binary heap to keep track of updates
    updateQueue.sort((a, b) => a.tick - b.tick)
  }

  serv.notifyNeighborsOfStateChangeDirectional = (world, pos, dir, fromTick, tick, forceNotify = false, data = null) => {
    // TODO: it would be better to know the list of loaded worlds at initialisation
    if (!worldUpdateQueue.has(world)) {
      worldUpdateQueue.set(world, { updateQueue: [], updateSet: new Set() })
    }
    const { updateQueue, updateSet } = worldUpdateQueue.get(world)
    const p = pos.plus(dir)
    if (dir.x !== 1) addUpdate(updateQueue, updateSet, { pos: p.offset(-1, 0, 0), fromTick, tick, forceNotify, data }) // east
    if (dir.x !== -1) addUpdate(updateQueue, updateSet, { pos: p.offset(1, 0, 0), fromTick, tick, forceNotify, data }) // west
    if (dir.y !== 1) addUpdate(updateQueue, updateSet, { pos: p.offset(0, -1, 0), fromTick, tick, forceNotify, data }) // down
    if (dir.y !== -1) addUpdate(updateQueue, updateSet, { pos: p.offset(0, 1, 0), fromTick, tick, forceNotify, data }) // up
    if (dir.z !== 1) addUpdate(updateQueue, updateSet, { pos: p.offset(0, 0, -1), fromTick, tick, forceNotify, data }) // north
    if (dir.z !== -1) addUpdate(updateQueue, updateSet, { pos: p.offset(0, 0, 1), fromTick, tick, forceNotify, data }) // south
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
    const block = mcData.blocksByName[name]
    if (updateHandlers.has(block.id)) {
      serv.warn(`onBlockUpdate handler was registered twice for ${name}`)
    }
    updateHandlers.set(block.id, handler)
  }

  serv.on('tick', async (tickTime, curTick) => {
    for (const [world, { updateQueue, updateSet }] of worldUpdateQueue.entries()) {
      const start = performance.now()

      const chunkUpdates = new ChunkUpdates()
      let updatesCount = 0
      while (updatesCount < serv.MAX_UPDATES_PER_TICK && updateQueue.length > 0) {
        if (updateQueue[0].tick > curTick) break // We are done for this tick

        const { pos, fromTick, tick, data, forceNotify } = updateQueue.shift()
        const hash = pos + ',' + fromTick + ',' + tick + ',' + forceNotify
        updateSet.delete(hash)

        const block = await world.getBlock(pos)
        block.position = pos

        const handler = updateHandlers.get(block.type)
        if (handler) {
          const changed = await handler(world, block, fromTick, tick, data)
          if (changed) {
            chunkUpdates.add(pos)
          } else if (forceNotify) {
            serv.notifyNeighborsOfStateChange(world, pos, fromTick, tick)
          }
        } else if (forceNotify) {
          serv.notifyNeighborsOfStateChange(world, pos, fromTick, tick)
        }
        updatesCount++
      }

      const multiBlockUpdates = await chunkUpdates.getMultiBlockPackets(world)
      const players = serv.players.filter(p => p.world === world)
      for (const chunkUpdate of multiBlockUpdates) {
        // TODO: we could test if the chunk is within the view distance of the player
        players.forEach(player => player._client.write('multi_block_change', chunkUpdate))
      }

      // TODO: chunkUpdates could also be used to update light

      if (updatesCount > 0) {
        const time = performance.now() - start
        const fraction = (time * 100 / 50).toFixed(2)
        const sentUpdates = chunkUpdates.updateCount()
        serv.info(`[Block Update] Made ${updatesCount} (${sentUpdates}) updates, ${updateQueue.length} remainings (${fraction}% of tickTime)`)
      }
    }
  })
}
