import { Vec3 } from 'vec3'

function randomInt (low, high) {
  return Math.floor(Math.random() * (high - low) + low)
}

export const server = function (serv: Server, settings: Options) {
  serv.gameMode = settings.gameMode
  serv.difficulty = settings.difficulty
  const registry = require('prismarine-registry')(settings.version)

  const waterBlocks = new Set([registry.blocksByName.water.id])
  if (registry.blocksByName.flowing_water !== undefined) {
    waterBlocks.add(registry.blocksByName.flowing_water.id)
  }

  async function findSpawnZone (world, initialPoint) {
    let point = initialPoint
    while ((await (world.getBlockType(point))) === 0) { point = point.offset(0, -1, 0) }
    while (true) {
      const p = await world.getBlockType(point)
      if (!waterBlocks.has(p)) { break }
      point = point.offset(1, 0, 0)
    }
    while ((await world.getBlockType(point)) !== 0) { point = point.offset(0, 1, 0) }

    return point
  }

  serv.getSpawnPoint = async (world) => {
    return await findSpawnZone(world, new Vec3(randomInt(0, 30), 81, randomInt(0, 30)))
  }
}

export const player = function (player: Player, serv: Server) {
  player.prevGameMode = 255
  player.gameMode = serv.gameMode
  player.findSpawnPoint = async () => {
    player.spawnPoint = await serv.getSpawnPoint(player.world)
  }
  player._client.on('settings', ({ viewDistance }) => {
    player.view = viewDistance
    player.sendRestMap()
  })
}
declare global {
  interface Server {
    /** @internal */
    'gameMode': any
    /** @internal */
    'difficulty': any
    /** @internal */
    'getSpawnPoint': (world: any) => Promise<any>
  }
  interface Player {
    /** @internal */
    spawnPoint: Vec3
    /** The view size of the player, for example 8 for 16x16 */
    view: number
    /** @internal */
    'prevGameMode': number
    /** @internal */
    'gameMode': any
    /** @internal */
    'findSpawnPoint': () => Promise<void>
  }
}
