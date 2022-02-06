const Vec3 = require('vec3').Vec3

module.exports.player = function (player, serv, { version }) {
  const mcData = require('minecraft-data')(version)
  //Interaction with a chest
  serv.onBlockInteraction('chest', async ({block, player}) => {
    if (player.crouching) return
    try {
      const id = await player.world.getBlockType(block.position)
      const blockAbove = await player.world.getBlockType(block.position.plus(new Vec3(0, 1, 0)))
      const blockChest = mcData.blocksByName.chest
      serv.playSound('block.chest.open', player.world, block.position, {})
      if (blockAbove) { return }
      //Opening chest GUI window
      player._client.write('open_window', {
        windowId: 1,
        inventoryType: 2,
        windowTitle: JSON.stringify({"translate":"container.chest"}),
      })
      //Sending chest content (NOT IMPLEMENTED)
      player._client.write('window_items', {
        windowId: 1,
        stateId: 1,
        items: [
          { present: false },{ present: false },{ present: false },{ present: false },{ present: false },{ present: false },{ present: false },{ present: false },{ present: false },
          { present: false },{ present: false },{ present: false },{ present: false },{ present: false },{ present: false },{ present: false },{ present: false },{ present: false },
          { present: false },{ present: false },{ present: false },{ present: false },{ present: false },{ present: false },{ present: false },{ present: false },{ present: false }],
        carriedItem: { present: false }
      })

      return true
    } catch (err) {
      setTimeout(() => { throw err }, 0)
    }
  })
}
