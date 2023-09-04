const spiralloop = require('spiralloop')
const Vec3 = require('vec3').Vec3

const generations = require('flying-squid').generations
const { promisify } = require('util')
const fs = require('fs')
const { level } = require('prismarine-provider-anvil')

const playerDat = require('../playerDat')

const fsStat = promisify(fs.stat)
const fsMkdir = promisify(fs.mkdir)

module.exports.server = async function (serv, { version, worldFolder, generation = { name: 'diamond_square', options: { worldHeight: 80 } } } = {}) {
  const World = require('prismarine-world')(version)
  const mcData = require('minecraft-data')(version)
  const Anvil = require('prismarine-provider-anvil').Anvil(version)

  const newSeed = generation.options.seed || Math.floor(Math.random() * Math.pow(2, 31))
  let seed
  let regionFolder
  if (worldFolder) {
    regionFolder = worldFolder + '/region'
    try {
      await fsStat(regionFolder)
    } catch (err) {
      await fsMkdir(regionFolder, { recursive: true })
    }

    try {
      const levelData = await level.readLevel(worldFolder + '/level.dat')
      seed = levelData.RandomSeed[0]
    } catch (err) {
      seed = newSeed
      await level.writeLevel(worldFolder + '/level.dat', { RandomSeed: [seed, 0] })
    }
  } else { seed = newSeed }
  generation.options.seed = seed
  generation.options.version = version
  serv.emit('seed', generation.options.seed)
  const generationModule = generations[generation.name] ? generations[generation.name] : require(generation.name)
  serv.overworld = new World(generationModule(generation.options), regionFolder === undefined ? null : new Anvil(regionFolder))
  serv.netherworld = new World(generations.nether(generation.options))
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
      serv.setBlock(world, position, mcData.blocks[id].minStateId)
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

  serv.chunksUsed = {}
  serv._loadPlayerChunk = (chunkX, chunkZ, player) => {
    const id = chunkX + ',' + chunkZ
    if (!serv.chunksUsed[id]) {
      serv.chunksUsed[id] = 0
    }
    serv.chunksUsed[id]++
    const loaded = player.loadedChunks[id]
    if (!loaded) player.loadedChunks[id] = 1
    return !loaded
  }
  serv._unloadPlayerChunk = (chunkX, chunkZ, player) => {
    const id = chunkX + ',' + chunkZ
    delete player.loadedChunks[id]
    if (serv.chunksUsed[id] > 0) {
      serv.chunksUsed[id]--
    }
    if (!serv.chunksUsed[id]) {
      player.world.unloadColumn(chunkX, chunkZ)
      return true
    }
    return false
  }

  // serv.pregenWorld(serv.overworld).then(() => serv.info('Pre-Generated Overworld'));
  // serv.pregenWorld(serv.netherworld).then(() => serv.info('Pre-Generated Nether'));
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
  player.save = () => {
    playerDat.save(player, settings.worldFolder, serv.supportFeature('attributeSnakeCase'), serv.supportFeature('theFlattening'))
  }

  player._unloadChunk = (chunkX, chunkZ) => {
    serv._unloadPlayerChunk(chunkX, chunkZ, player)

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
      player._client.write('map_chunk', {
        x,
        z,
        groundUp: true,
        bitMap: chunk.getMask(),
        biomes: chunk.dumpBiomes(),
        ignoreOldData: true, // should be false when a chunk section is updated instead of the whole chunk being overwritten, do we ever do that?
        heightmaps: {
          type: 'compound',
          name: '',
          value: {
            MOTION_BLOCKING: { type: 'longArray', value: new Array(36).fill([0, 0]) }
          }
        }, // FIXME: fake heightmap
        chunkData: chunk.dump(),
        blockEntities: []
      })
      if (serv.supportFeature('lightSentSeparately')) {
        player._client.write('update_light', {
          chunkX: x,
          chunkZ: z,
          trustEdges: true, // should be false when a chunk section is updated instead of the whole chunk being overwritten, do we ever do that?
          skyLightMask: chunk.skyLightMask,
          blockLightMask: chunk.blockLightMask,
          emptySkyLightMask: 0,
          emptyBlockLightMask: 0,
          data: chunk.dumpLight()
        })
      }
      return Promise.resolve()
    })
  }

  function spiral (arr) {
    const t = []
    spiralloop(arr, (x, z) => {
      t.push([x, z])
    })
    return t
  }

  player.sendNearbyChunks = (view, group) => {
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
      .filter(({ chunkX, chunkZ }) => serv._loadPlayerChunk(chunkX, chunkZ, player))
      .reduce((acc, { chunkX, chunkZ }) => {
        const p = acc
          .then(() => player.world.getColumn(chunkX, chunkZ))
          .then((column) => player.sendChunk(chunkX, chunkZ, column))
        return group ? p.then(() => sleep(5)) : p
      }
      , Promise.resolve())
  }

  function sleep (ms = 0) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  player.sendMap = () => {
    return player.sendNearbyChunks(Math.min(3, settings['view-distance']))
      .catch((err) => setTimeout(() => { throw err }), 0)
  }

  // todo as I understand need to handle difficulty packet instead?
  player.on('playerChangeRenderDistance', (newDistance = player.view, unloadFirst = false) => {
    player.view = newDistance
    if (unloadFirst) player._unloadAllChunks()
    player.sendRestMap()
  })
  player.sendRestMap = () => {
    player.sendingChunks = true
    player.sendNearbyChunks(Math.min(player.view, settings['view-distance']), true)
      .then(() => { player.sendingChunks = false })
      .catch((err) => setTimeout(() => { throw err }, 0))
  }

  player.sendSpawnPosition = () => {
    player._client.write('spawn_position', {
      location: player.spawnPoint
    })
  }

  player._unloadAllChunks = () => {
    Object.keys(player.loadedChunks)
      .map((key) => key.split(',').map(a => parseInt(a)))
      .forEach(([x, z]) => player._unloadChunk(x, z))
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
    player._client.write('respawn', {
      previousGameMode: player.prevGameMode,
      dimension: serv.supportFeature('dimensionIsAString') ? serv.dimensionNames[opt.dimension || 0] : opt.dimension || 0,
      worldName: serv.dimensionNames[opt.dimension || 0],
      difficulty: opt.difficulty || serv.difficulty,
      hashedSeed: serv.hashedSeed,
      gamemode: opt.gamemode || player.gameMode,
      levelType: 'default',
      isDebug: false,
      isFlat: false,
      copyMetadata: true
    })
    await player.findSpawnPoint()
    player.position = player.spawnPoint
    player.sendSpawnPosition()
    player.updateAndSpawn()

    await player.sendMap()

    player.sendSelfPosition()
    player.emit('change_world')

    await player.waitPlayerLogin()
    player.sendRestMap()
  }
}
