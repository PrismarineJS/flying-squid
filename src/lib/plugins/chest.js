const Vec3 = require('vec3').Vec3

module.exports.player = function (player, serv, { version }) {
  const mcData = require('minecraft-data')(version)
  // Interaction with a container block
  const chestsBlockInteractionHandler = async ({ block, player }) => {
    if (player.crouching) return
    try {
      const id = await player.world.getBlockType(block.position)
      const blockAbove = await player.world.getBlockType(block.position.plus(new Vec3(0, 1, 0)))
      const blockChest = mcData.blocksByName.chest
      // Dynamic window ID feature
      if (player.windowId === undefined) { player.windowId = 1 } else { player.windowId = player.windowId + 1 }
      player.windowType = id === blockChest.id ? 'chest' : 'enderchest'
      player.windowPos = block.position
      // Playing sound of opening chest
      if (blockAbove) { return }
      serv.playSound('block.chest.open', player.world, block.position, {})
      // Opening chest GUI window
      const chestWindowTitle = id === blockChest.id ? { translate: 'container.chest' } : { translate: 'container.enderchest' }
      player._client.write('open_window', {
        windowId: player.windowId,
        inventoryType: 2,
        windowTitle: JSON.stringify(chestWindowTitle)
      })
      // Sending chest content (NOT IMPLEMENTED)
      player._client.write('window_items', {
        windowId: player.windowId,
        stateId: 1,
        items: [
          { present: false }, { present: false }, { present: false }, { present: false }, { present: false }, { present: false }, { present: false }, { present: false }, { present: false },
          { present: false }, { present: false }, { present: false }, { present: false }, { present: false }, { present: false }, { present: false }, { present: false }, { present: false },
          { present: false }, { present: false }, { present: false }, { present: false }, { present: false }, { present: false }, { present: false }, { present: false }, { present: false }],
        carriedItem: { present: false }
      })
      return true
    } catch (err) {
      setTimeout(() => { throw err }, 0)
    }
  }
  // Registering block interaction handlers
  serv.onBlockInteraction('chest', chestsBlockInteractionHandler)
  serv.onBlockInteraction('ender_chest', chestsBlockInteractionHandler)
}
