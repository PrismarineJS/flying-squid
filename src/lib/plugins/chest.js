const Vec3 = require('vec3').Vec3

module.exports.player = function (player) {
  player.on('placeBlock_cancel', async (opt, cancel) => {
    if (player.crouching) return
    try {
      const id = await player.world.getBlockType(opt.reference)
      const blockAbove = await player.world.getBlockType(opt.reference.plus(new Vec3(0, 1, 0)))
      if (id === 54) {
        opt.playSound = false
        if (blockAbove) {
          return
        }
        player._client.write('open_window', {
          windowId: 165,
          inventoryType: 'minecraft:chest',
          windowTitle: JSON.stringify('Chest'),
          slotCount: 9 * 3 + 8 // 3 rows, make nicer later
        })
        cancel()
      }
    } catch (err) {
      setTimeout(() => { throw err }, 0)
    }
  })
}
