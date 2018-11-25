const Vec3 = require('vec3').Vec3

function randomInt (low, high) {
  return Math.floor(Math.random() * (high - low) + low)
}

module.exports.server = function (serv, settings) {
  serv.gameMode = settings.gameMode
  serv.difficulty = settings.difficulty

  async function findSpawnZone (world, initialPoint) {
    let point = initialPoint
    while ((await (world.getBlockType(point))) === 0) { point = point.offset(0, -1, 0) }
    while (true) {
      const p = await world.getBlockType(point)
      if (p !== 8 && p !== 9) { break }
      point = point.offset(1, 0, 0)
    }
    while ((await world.getBlockType(point)) !== 0) { point = point.offset(0, 1, 0) }

    return point
  }

  serv.getSpawnPoint = async (world) => {
    return findSpawnZone(world, new Vec3(randomInt(0, 30), 81, randomInt(0, 30)))
  }
}

module.exports.player = async function (player, serv) {
  player.gameMode = serv.gameMode
  player.findSpawnPoint = async () => {
    player.spawnPoint = await serv.getSpawnPoint(player.world)
  }
  player._client.on('settings', ({ viewDistance }) => {
    player.view = viewDistance
  })
}
