const spiralloop = require('spiralloop')
import { gzip } from 'node-gzip'
import nbt from 'prismarine-nbt'

import { promisify } from 'util'
import fs from 'fs'
import { level, Anvil as AnvilLoader } from 'prismarine-provider-anvil'

import * as playerDat from '../playerDat'
import { Chunk, World } from 'prismarine-world/types/world'
import WorldLoader from 'prismarine-world'
import RegistryLoader from 'prismarine-registry'
import { LevelDatFull } from 'prismarine-provider-anvil/src/level'
import generations from '../generations'
import { Vec3 } from 'vec3'

const fsStat = promisify(fs.stat)
const fsMkdir = promisify(fs.mkdir)

export const server = async function (serv: Server, options: Options) {
  const { version, worldFolder, generation = { name: 'diamond_square', options: { worldHeight: 80 } } } = options
  const World = WorldLoader(version)
  const registry = RegistryLoader(version)
  const Anvil = AnvilLoader.Anvil(version)

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
      await level.writeLevel(worldFolder + '/level.dat', {
        RandomSeed: [seed, 0],
        Version: { Name: options.version },
        generatorName: generation.name === 'superflat' ? 'flat' : generation.name === 'diamond_square' ? 'default' : 'customized',
        LevelName: options.levelName,
        allowCommands: true,
      })
    }
  } else { seed = newSeed }
  const generationOptions = {
    ...generation.options,
    seed,
    version,
  }
  serv.emit('seed', generationOptions.seed)
  const generationModule: (options) => any = generations[generation.name] ? generations[generation.name] : require(generation.name)
  serv.overworld = new World(generationModule(generationOptions), regionFolder === undefined ? null : new Anvil(regionFolder), options.savingInterval as any) as CustomWorld
  serv.netherworld = new World(generations.nether(generationOptions)) as CustomWorld
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
    const promises: Promise<Chunk>[] = []
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

  if (registry.supportFeature('theFlattening')) {
    serv.setBlockType = async (world, position, id) => {
      serv.setBlock(world, position, registry.blocks[id].minStateId!)
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

  serv.savePlayersSingleplayer = async () => {
    const savedData = await serv.players[0].save()
    // if we ever support level.dat saving this function needs to be changed i guess
    const levelDatContent = await fs.promises.readFile(worldFolder + '/level.dat')
    const { parsed } = await nbt.parse(levelDatContent)
    //@ts-ignore
    parsed.value.Data.value.Player = savedData
    const newDataCompressed = await gzip(nbt.writeUncompressed(parsed))
    await fs.promises.writeFile(worldFolder + '/level.dat', newDataCompressed)

    await Promise.all(serv.players.slice(1).map(async player => player.save()))
  }
}

const player = function (player: Player, serv: Server, settings: Options) {
  const registry = RegistryLoader(settings.version)

  player.flying = 0
  player._client.on('abilities', ({ flags }) => {
    // todo check can fly!!
    player.flying = flags & 2
  })

  player.save = async () => {
    await playerDat.save(player, settings.worldFolder, registry.supportFeature('attributeSnakeCase'), registry.supportFeature('theFlattening'))
  }

  player._unloadChunk = (chunkX, chunkZ) => {
    serv._unloadPlayerChunk(chunkX, chunkZ, player)

    if (registry.supportFeature('unloadChunkByEmptyChunk')) {
      player._client.write('map_chunk', {
        x: chunkX,
        z: chunkZ,
        groundUp: true,
        bitMap: 0x0000,
        chunkData: Buffer.alloc(0)
      })
    } else if (registry.supportFeature('unloadChunkDirect')) {
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
      if (registry.supportFeature('lightSentSeparately')) {
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

  player.sendNearbyChunks = (view, group) => {
    player.lastPositionChunkUpdated = player.position
    const playerChunkX = Math.floor(player.position.x / 16)
    const playerChunkZ = Math.floor(player.position.z / 16)

    Object.keys(player.loadedChunks)
      .map((key) => key.split(',').map(a => parseInt(a)))
      .filter(([x, z]) => Math.abs(x - playerChunkX) > view || Math.abs(z - playerChunkZ) > view)
      .forEach(([x, z]) => player._unloadChunk(x, z))

    return spiralloop([view * 2, view * 2])
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
    return player.sendNearbyChunks(settings['view-distance'])
      .catch((err) => setTimeout(() => { throw err }))
  }

  player.sendRestMap = () => {
    player.sendingChunks = true
    player.sendNearbyChunks(Math.min(player.view, settings['view-distance'] ?? 3), true)
      .then(() => { player.sendingChunks = false })
      .catch((err) => setTimeout(() => { throw err }))
  }

  player.sendSpawnPosition = () => {
    player._client.write('spawn_position', {
      location: player.spawnPoint
    })
  }

  player._unloadAllChunks = () => {
    if (!player?.loadedChunks) return
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
      dimension: (registry.supportFeature('dimensionIsAString') || registry.supportFeature('dimensionIsAWorld')) ? serv.dimensionNames[opt.dimension || 0] : opt.dimension || 0,
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

export interface CustomWorld extends World {
  blockEntityData: Record<string, any>
  portals: any[]
}

declare global {
  interface Server {
    /** @internal */
    looseProtocolMode: any
    /** @internal */
    lastPositionChunkUpdated: Vec3
    /** @internal */
    spawnPoint: Vec3
    /** @internal */
    levelData: LevelDatFull
    /** Contains the overworld world. This is where the default spawn point is */
    "overworld": CustomWorld
    /** Contains the nether world. This **WILL** be used when a player travels through a portal if they are in the overworld! */
    "netherworld": CustomWorld
    /** @internal */
    "dimensionNames": { '-1': string; 0: string }
    /** @internal */
    "pregenWorld": (world: CustomWorld, size?: number) => Promise<Chunk[]>
    /** Saves block in world and sends block update to all players of the same world. */
    "setBlock": (world: CustomWorld, position: Vec3, stateId: number) => Promise<void>
    /** @internal */
    "setBlockType": (world: CustomWorld, position: Vec3, id: number) => Promise<void>
    /** Sends a block action to all players of the same world. */
    "setBlockAction": (world: CustomWorld, position: Vec3, actionId: number, actionParam: any) => Promise<void>
    /** @internal */
    "reloadChunks": (world: CustomWorld, chunks: any) => void
    /** @internal */
    "chunksUsed": {}
    /** @internal */
    "_loadPlayerChunk": (chunkX: number, chunkZ: number, player: Player) => boolean
    /** @internal */
    "_unloadPlayerChunk": (chunkX: number, chunkZ: number, player: Player) => boolean
    /** @internal */
    "savePlayersSingleplayer": () => Promise<void>
  }
  interface Player {
    /** @internal */
    lastPositionChunkUpdated: Vec3
    /** @internal */
    sendingChunks: boolean
    /** @internal */
    world: CustomWorld
    /** @internal */
    "flying": number
    /** If `worldFolder` option is set, save player's data into `<worldFolder>/playerdata/<UUID>.dat`. Returns promise.,    * Example: save all players data to disk:,    * ,    * ```js,    * for (const player of serv.players) {,    *   player.save(),    * },    * ```    */
    "save": () => Promise<any>
    /** @internal */
    "_unloadChunk": (chunkX: any, chunkZ: any) => void
    /** @internal */
    "sendChunk": (chunkX: any, chunkZ: any, column: any) => Promise<void>
    /** @internal */
    "sendNearbyChunks": (viewDistance: any, group?) => Promise<any>
    /** @internal */
    "sendMap": () => any
    /** @internal */
    "sendRestMap": () => void
    /** @internal */
    "sendSpawnPosition": () => void
    /** @internal */
    "_unloadAllChunks": () => void
    /** The world object which the player is in (use serv.overworld, serv.netherworld, serv.endworld, or a custom world). Options:,    * ,    * - gamemode: Gamemode of the world (Default is player gamemode),    * - difficulty: Difficulty of world. Default is 0 (easiest),    * - dimension: Dimension of world. 0 is Overworld, -1 is Nether, 1 is End (Default is 0)    */
    "changeWorld": (world: any, opt: any) => Promise<void>
  }
}
