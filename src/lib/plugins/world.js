const spiralloop = require('spiralloop')

const generations = require('flying-squid').generations
const { promisify } = require('util')
const fs = require('fs')
const { level } = require('prismarine-provider-anvil')

const fsStat = promisify(fs.stat)
const fsMkdir = promisify(fs.mkdir)

module.exports.server = async function (serv, { version, worldFolder, generation = { 'name': 'diamond_square', 'options': { 'worldHeight': 80 } } } = {}) {
  const World = require('prismarine-world')(version)

  const newSeed = generation.options.seed || Math.floor(Math.random() * Math.pow(2, 31))
  let seed
  let regionFolder
  if (worldFolder) {
    regionFolder = worldFolder + '/region'
    try {
      await fsStat(regionFolder)
    } catch (err) {
      await fsMkdir(regionFolder)
    }

    try {
      const levelData = await level.readLevel(worldFolder + '/level.dat')
      seed = levelData['RandomSeed'][0]
    } catch (err) {
      seed = newSeed
      await level.writeLevel(worldFolder + '/level.dat', { 'RandomSeed': [seed, 0] })
    }
  } else { seed = newSeed }
  generation.options.seed = seed
  generation.options.version = version
  serv.emit('seed', generation.options.seed)
  const generationModule = generations[generation.name] ? generations[generation.name] : require(generation.name)
  serv.overworld = new World(generationModule(generation.options), regionFolder)
  serv.netherworld = new World(generations['nether'](generation.options))
  // serv.endworld = new World(generations["end"]({}));

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

  serv.setBlock = async (world, position, blockType, blockData) => {
    serv.players
      .filter(p => p.world === world)
      .forEach(player => player.sendBlock(position, blockType, blockData))

    await world.setBlockType(position, blockType)
    await world.setBlockData(position, blockData)
  }

  serv.reloadChunks = (world, chunks) => {
    serv.players
      .filter(player => player.world === world)
      .forEach(oPlayer => {
        chunks
          .filter(({ chunkX, chunkZ }) => oPlayer.loadedChunks[chunkX + ',' + chunkZ] !== undefined)
          .forEach(({ chunkX, chunkZ }) => oPlayer.unloadChunk(chunkX, chunkZ))
        oPlayer.sendRestMap()
      })
  }

  // serv.pregenWorld(serv.overworld).then(() => serv.log('Pre-Generated Overworld'));
  // serv.pregenWorld(serv.netherworld).then(() => serv.log('Pre-Generated Nether'));
}

module.exports.player = function (player, serv, settings) {
  player.unloadChunk = (chunkX, chunkZ) => {
    delete player.loadedChunks[chunkX + ',' + chunkZ]

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
        x: x,
        z: z,
        groundUp: true,
        bitMap: 0xffff,
        chunkData: chunk.dump(),
        blockEntities: []
      })
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
      .forEach(([x, z]) => player.unloadChunk(x, z))

    return spiral([view * 2, view * 2])
      .map(t => ({
        chunkX: playerChunkX + t[0] - view,
        chunkZ: playerChunkZ + t[1] - view
      }))
      .filter(({ chunkX, chunkZ }) => {
        const key = chunkX + ',' + chunkZ
        const loaded = player.loadedChunks[key]
        if (!loaded) player.loadedChunks[key] = 1
        return !loaded
      })
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

  player.sendRestMap = () => {
    player.sendingChunks = true
    player.sendNearbyChunks(Math.min(player.view, settings['view-distance']), true)
      .then(() => { player.sendingChunks = false })
      .catch((err) => setTimeout(() => { throw err }, 0))
  }

  player.sendSpawnPosition = () => {
    player._client.write('spawn_position', {
      'location': player.spawnPoint
    })
  }

  player.changeWorld = async (world, opt) => {
    if (player.world === world) return Promise.resolve()
    opt = opt || {}
    player.world = world
    player.loadedChunks = {}
    if (typeof opt.gamemode !== 'undefined') player.gameMode = opt.gamemode
    player._client.write('respawn', {
      dimension: opt.dimension || 0,
      difficulty: opt.difficulty || serv.difficulty,
      gamemode: opt.gamemode || player.gameMode,
      levelType: 'default'
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

  player.commands.add({
    base: 'changeworld',
    info: 'to change world',
    usage: '/changeworld overworld|nether',
    op: true,
    action (world) {
      if (world === 'nether') player.changeWorld(serv.netherworld, { dimension: -1 })
      if (world === 'overworld') player.changeWorld(serv.overworld, { dimension: 0 })
    }
  })
}
