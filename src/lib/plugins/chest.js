const Vec3 = require('vec3').Vec3

module.exports.player = function (player, serv, { version }) {
  // Importing necessary libraries
  const mcData = require('minecraft-data')(version)
  // Getting ALL supported blocks
  // Chests
  const blockChest = mcData.blocksByName.chest
  const blockEnderChest = mcData.blocksByName.ender_chest
  // TODO: Large chest (NOT IMPLEMENTED)
  // Shulker boxes
  let blockShulkerBox = []
  if (serv.supportFeature('theShulkerBoxes')) {
    blockShulkerBox = [mcData.blocksByName.shulker_box.id, mcData.blocksByName.red_shulker_box.id,
      mcData.blocksByName.orange_shulker_box.id, mcData.blocksByName.yellow_shulker_box.id, mcData.blocksByName.lime_shulker_box.id,
      mcData.blocksByName.green_shulker_box.id, mcData.blocksByName.light_blue_shulker_box.id, mcData.blocksByName.cyan_shulker_box.id,
      mcData.blocksByName.blue_shulker_box.id, mcData.blocksByName.purple_shulker_box.id, mcData.blocksByName.magenta_shulker_box.id,
      mcData.blocksByName.brown_shulker_box.id, mcData.blocksByName.gray_shulker_box.id, mcData.blocksByName.light_gray_shulker_box.id,
      mcData.blocksByName.black_shulker_box.id, mcData.blocksByName.white_shulker_box.id, mcData.blocksByName.pink_shulker_box.id]
  }
  // Interaction with a chest-like ontainer block
  const chestsBlockInteractionHandler = async ({ block, player }) => {
    if (player.crouching) return
    try {
      // Getting current block and block above it
      const id = await player.world.getBlockType(block.position)
      const blockAbove = await player.world.getBlockType(block.position.plus(new Vec3(0, 1, 0)))
      // Playing sound of opening chest
      if (blockAbove) { return }
      serv.playSound('block.chest.open', player.world, block.position, {})
      // Dynamic window ID feature
      if (player.windowId === undefined) { player.windowId = 1 } else { player.windowId = player.windowId + 1 }
      let chestWindowTitle = 'Unknown'
      if (id === blockChest.id) {
        chestWindowTitle = { translate: 'container.chest' }
        player.windowType = 'chest'
      }
      if (id === blockEnderChest.id) {
        chestWindowTitle = { translate: 'container.enderchest' }
        player.windowType = 'ender_chest'
      }
      // TODO: Large chest (NOT IMPLEMENTED)
      if (blockShulkerBox.includes(id)) {
        chestWindowTitle = { translate: 'container.shulkerBox' }
        player.windowType = 'shulker_box'
      }
      player.windowPos = block.position
      // Opening chest GUI window
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
  // Chests
  serv.onBlockInteraction(mcData.blocksByName.chest.name, chestsBlockInteractionHandler)
  serv.onBlockInteraction(mcData.blocksByName.ender_chest.name, chestsBlockInteractionHandler)
  // TODO: Large chest (NOT IMPLEMENTED)
  // Shulker boxes
  if (serv.supportFeature('theShulkerBoxes')) {
    for (const currentShulkerBoxID of blockShulkerBox) {
      serv.onBlockInteraction(mcData.blocks[currentShulkerBoxID].name, chestsBlockInteractionHandler)
    }
  }
}
