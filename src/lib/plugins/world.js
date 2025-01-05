const fs = require('fs')
const { Vec3 } = require('vec3')
const generations = require('../generations')
const playerDat = require('../playerDat')
const spiralloop = require('spiralloop')
const { level } = require('prismarine-provider-anvil')
const nbt = require('prismarine-nbt')

function sleep (ms = 0) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports.server = async function (serv, options = {}) {
  const { version, worldFolder, generation = { name: 'diamond_square', options: { worldHeight: 80 } } } = options
  const { registry } = serv
  const World = require('prismarine-world')(registry)
  const Anvil = require('prismarine-provider-anvil').Anvil(registry)

  const newSeed = generation.options.seed || Math.floor(Math.random() * Math.pow(2, 31))
  let seed
  let regionFolder
  if (worldFolder) {
    regionFolder = worldFolder + '/region'
    if (!fs.existsSync(regionFolder)) {
      fs.mkdirSync(regionFolder, { recursive: true })
    }

    try {
      const levelData = await level.readLevel(worldFolder + '/level.dat')
      seed = levelData.RandomSeed[0]
    } catch (err) {
      serv.debug?.(err)
      serv.debug?.('Creating new level.dat')
      seed = newSeed
      await level.writeLevel(worldFolder + '/level.dat', {
        RandomSeed: [seed, 0],
        Version: { Name: options.version },
        generatorName: { superflat: 'flat', diamond_square: 'default' }[generation.name] || 'customized'
      })
    }
  } else {
    seed = newSeed
  }
  generation.options.seed = seed
  generation.options.version = version
  serv.emit('seed', generation.options.seed)
  const generationModule = generations[generation.name] ? generations[generation.name] : require(generation.name)
  const genOpts = { ...generation.options, registry }
  serv.overworld = new World(generationModule(genOpts), regionFolder === undefined ? null : new Anvil(regionFolder))
  serv.netherworld = new World(generations.nether(genOpts))
  // serv.endworld = new World(generations["end"]({}));

  serv.dimensionNames = {
    '-1': 'minecraft:nether',
    0: 'minecraft:overworld'
    // 1: 'minecraft:end'
  }

  // WILL BE REMOVED WHEN ACTUALLY IMPLEMENTED
  serv.overworld.blockEntityData = {}
  serv.netherworld.blockEntityData = {}
  serv.overworld.portals = []
  serv.netherworld.portals = []
  /// ///////////

  serv.pregenWorld = (world, size = 3) => {
    const promises = []
    for (let x = -size; x < size; x++) {
      for (let z = -size; z < size; z++) {
        promises.push(world.getColumn(x, z))
      }
    }
    return Promise.all(promises)
  }
  // serv.pregenWorld(serv.overworld).then(() => serv.info('Pre-Generated Overworld'));
  // serv.pregenWorld(serv.netherworld).then(() => serv.info('Pre-Generated Nether'));

  serv.setBlock = async (world, position, stateId) => {
    serv.players
      .filter(p => p.world === world)
      .forEach(player => player.sendBlock(position, stateId))
    await world.setBlockStateId(position, stateId)
    if (stateId === 0) serv.notifyNeighborsOfStateChange(world, position, serv.tickCount, serv.tickCount, true)
    else serv.updateBlock(world, position, serv.tickCount, serv.tickCount, true)
  }

  if (serv.supportFeature('theFlattening')) {
    serv.setBlockType = async (world, position, id) => {
      serv.setBlock(world, position, serv.registry.blocks[id].minStateId)
    }
  } else {
    serv.setBlockType = async (world, position, id) => {
      serv.setBlock(world, position, id << 4)
    }
  }

  serv.setBlockAction = async (world, position, actionId, actionParam) => {
    const location = new Vec3(position.x, position.y, position.z)
    const blockType = await world.getBlockType(location)

    serv.players
      .filter(p => p.world === world)
      .forEach(player => player.sendBlockAction(position, actionId, actionParam, blockType))
  }

  serv.reloadChunks = (world, chunks) => {
    serv.players
      .filter(player => player.world === world)
      .forEach(oPlayer => {
        chunks
          .filter(({ chunkX, chunkZ }) => oPlayer.loadedChunks[chunkX + ',' + chunkZ] !== undefined)
          .forEach(({ chunkX, chunkZ }) => oPlayer._unloadChunk(chunkX, chunkZ))
        oPlayer.sendRestMap()
      })
  }

  serv._worldChunksUsed = {}
  serv._worldLoadPlayerChunk = (chunkX, chunkZ, player) => {
    const id = chunkX + ',' + chunkZ
    if (!serv._worldChunksUsed[id]) {
      serv._worldChunksUsed[id] = 0
    }
    serv._worldChunksUsed[id]++
    const loaded = player.loadedChunks[id]
    if (!loaded) player.loadedChunks[id] = 1
    return !loaded
  }
  serv._worldUnloadPlayerChunk = (chunkX, chunkZ, player) => {
    const id = chunkX + ',' + chunkZ
    delete player.loadedChunks[id]
    if (serv._worldChunksUsed[id] > 0) {
      serv._worldChunksUsed[id]--
    }
    if (!serv._worldChunksUsed[id]) {
      player.world.unloadColumn(chunkX, chunkZ)
      return true
    }
    return false
  }

  serv.commands.add({
    base: 'changeworld',
    info: 'to change world',
    usage: '/changeworld overworld|nether',
    onlyPlayer: true,
    op: true,
    action (world, ctx) {
      if (world === 'nether') ctx.player.changeWorld(serv.netherworld, { dimension: -1 })
      if (world === 'overworld') ctx.player.changeWorld(serv.overworld, { dimension: 0 })
    }
  })
}

module.exports.player = function (player, serv, settings) {
  player.save = async () => {
    await playerDat.save(player, settings.worldFolder, serv.supportFeature('attributeSnakeCase'), serv.supportFeature('theFlattening'))
  }

  player._unloadChunk = (chunkX, chunkZ, isBecausePlayerLeft) => {
    serv._worldUnloadPlayerChunk(chunkX, chunkZ, player)
    if (isBecausePlayerLeft) return

    if (serv.supportFeature('unloadChunkByEmptyChunk')) {
      player._client.write('map_chunk', {
        x: chunkX,
        z: chunkZ,
        groundUp: true,
        bitMap: 0x0000,
        chunkData: Buffer.alloc(0)
      })
    } else if (serv.supportFeature('unloadChunkDirect')) {
      player._client.write('unload_chunk', {
        chunkX,
        chunkZ
      })
    }
  }

  player.sendChunk = (chunkX, chunkZ, column) => {
    return player.behavior('sendChunk', {
      x: chunkX,
      z: chunkZ,
      chunk: column
    }, ({ x, z, chunk }) => {
      // FIXME: fake heightmap
      const heightmaps = nbt.comp({
        MOTION_BLOCKING: nbt.longArray(new Array(36).fill([0, 0]))
      })
      const trustEdges = true // trust edges for lighting updates - should be false when a chunk section is updated instead of the whole chunk being overwritten, do we ever do that?
      if (serv.supportFeature('tallWorld')) { // 1.18+ - merged chunk and light data
        player._client.write('map_chunk', {
          x,
          z,
          heightmaps,
          chunkData: chunk.dump(),
          blockEntities: [],
          trustEdges,
          suppressLightUpdates: trustEdges, // 1.19.2
          ...chunk.dumpLight()
        })
      } else {
        player._client.write('map_chunk', {
          x,
          z,
          groundUp: true,
          bitMap: chunk.getMask(),
          biomes: chunk.dumpBiomes(),
          ignoreOldData: true, // should be false when a chunk section is updated instead of the whole chunk being overwritten, do we ever do that?
          heightmaps,
          chunkData: chunk.dump(),
          blockEntities: []
        })

        if (serv.supportFeature('newLightingDataFormat')) { // 1.17+
          player._client.write('update_light', {
            chunkX: x,
            chunkZ: z,
            trustEdges,
            ...chunk.dumpLight()
          })
        } else if (serv.supportFeature('lightSentSeparately')) { // -1.16.5
          player._client.write('update_light', {
            chunkX: x,
            chunkZ: z,
            trustEdges,
            skyLightMask: chunk.skyLightMask,
            blockLightMask: chunk.blockLightMask,
            emptySkyLightMask: 0,
            emptyBlockLightMask: 0,
            data: chunk.dumpLight()
          })
        }
      }
    })
  }

  function spiral (arr) {
    const t = []
    spiralloop(arr, (x, z) => {
      t.push([x, z])
    })
    return t
  }

  async function sendNearbyChunks (view, group) {
    player.lastPositionChunkUpdated = player.position
    const playerChunkX = Math.floor(player.position.x / 16)
    const playerChunkZ = Math.floor(player.position.z / 16)

    Object.keys(player.loadedChunks)
      .map((key) => key.split(',').map(a => parseInt(a)))
      .filter(([x, z]) => Math.abs(x - playerChunkX) > view || Math.abs(z - playerChunkZ) > view)
      .forEach(([x, z]) => player._unloadChunk(x, z))

    return spiral([view * 2, view * 2])
      .map(t => ({
        chunkX: playerChunkX + t[0] - view,
        chunkZ: playerChunkZ + t[1] - view
      }))
      .filter(({ chunkX, chunkZ }) => serv._worldLoadPlayerChunk(chunkX, chunkZ, player))
      .reduce((acc, { chunkX, chunkZ }) => {
        const p = acc
          .then(() => player.world.getColumn(chunkX, chunkZ))
          .then((column) => player.sendChunk(chunkX, chunkZ, column))
        return group ? p.then(() => sleep(5)) : p
      }, Promise.resolve())
  }

  player.worldSendInitialChunks = () => {
    return sendNearbyChunks(Math.min(3, settings['view-distance']))
  }

  player.worldSendRestOfChunks = async () => {
    player.sendingChunks = true
    await sendNearbyChunks(Math.min(player.view, settings['view-distance']), true)
    player.sendingChunks = false
  }

  player.worldSendAllChunks = player.worldSendRestOfChunks

  player.sendSpawnPosition = () => {
    player._client.write('spawn_position', {
      location: player.spawnPoint
    })
  }

  player.on('playerChangeRenderDistance', (newDistance = player.view, unloadFirst = false) => {
    player.view = newDistance
    if (unloadFirst) player._unloadAllChunks()
    player.worldSendRestOfChunks()
  })

  player._unloadAllChunks = (isBecausePlayerLeft) => {
    if (!player?.loadedChunks) return
    Object.keys(player.loadedChunks)
      .map((key) => key.split(',').map(a => parseInt(a)))
      .forEach(([x, z]) => player._unloadChunk(x, z, isBecausePlayerLeft))
  }

  player.changeWorld = async (world, opt) => {
    if (player.world === world) return Promise.resolve()
    opt = opt || {}
    player.world = world
    player._unloadAllChunks()
    if (typeof opt.gamemode !== 'undefined') {
      if (opt.gamemode !== player.gameMode) player.prevGameMode = player.gameMode
      player.gameMode = opt.gamemode
    }
    player._sendRespawn(opt.difficulty, opt.gamemode, opt.dimension)
    await player.findSpawnPoint()
    player.position = player.spawnPoint
    player.sendSpawnPosition()
    player.updateAndSpawn()

    await player.worldSendInitialChunks()

    player.sendSelfPosition()
    player.emit('change_world')

    await player.waitPlayerLogin()
    player.worldSendRestOfChunks()
    // Prevent player from falling through the world
    player.sendSelfPosition(player.spawnPoint)
  }
}
