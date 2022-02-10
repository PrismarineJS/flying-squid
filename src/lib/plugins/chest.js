const Vec3 = require('vec3').Vec3

module.exports.player = function (player, serv, { version }) {
  const mcData = require('minecraft-data')(version)
  // Interaction with a container block
  const chestsBlockInteractionHandler = async ({ block, player }) => {
    if (player.crouching) return
    try {
      // Getting current block and block above it
      const id = await player.world.getBlockType(block.position)
      const blockAbove = await player.world.getBlockType(block.position.plus(new Vec3(0, 1, 0)))
      // Getting ALL supported blocks
      // Chests
      const blockChest = mcData.blocksByName.chest
      const blockEnderChest = mcData.blocksByName.ender_chest
      // TODO: Large chest (NOT IMPLEMENTED)
      // Shulker boxes
      const blockShulkerBox = mcData.blocksByName.shulker_box
      const blockShulkerBoxRed = mcData.blocksByName.red_shulker_box
      const blockShulkerBoxOrange = mcData.blocksByName.orange_shulker_box
      const blockShulkerBoxYellow = mcData.blocksByName.yellow_shulker_box
      const blockShulkerBoxLime = mcData.blocksByName.lime_shulker_box
      const blockShulkerBoxGreen = mcData.blocksByName.green_shulker_box
      const blockShulkerBoxLightBlue = mcData.blocksByName.light_blue_shulker_box
      const blockShulkerBoxCyan = mcData.blocksByName.cyan_shulker_box
      const blockShulkerBoxBlue = mcData.blocksByName.blue_shulker_box
      const blockShulkerBoxPurple = mcData.blocksByName.purple_shulker_box
      const blockShulkerBoxMagenta = mcData.blocksByName.magenta_shulker_box
      const blockShulkerBoxBrown = mcData.blocksByName.brown_shulker_box
      const blockShulkerBoxGray = mcData.blocksByName.gray_shulker_box
      const blockShulkerBoxLightGray = mcData.blocksByName.light_gray_shulker_box
      const blockShulkerBoxBlack = mcData.blocksByName.black_shulker_box
      const blockShulkerBoxWhite = mcData.blocksByName.white_shulker_box
      const blockShulkerBoxPink = mcData.blocksByName.pink_shulker_box
      const blockShulkerBoxes = [blockShulkerBox.id, blockShulkerBoxRed.id, blockShulkerBoxOrange.id, blockShulkerBoxYellow.id,
        blockShulkerBoxLime.id, blockShulkerBoxGreen.id, blockShulkerBoxLightBlue.id, blockShulkerBoxCyan.id,
        blockShulkerBoxBlue.id, blockShulkerBoxPurple.id, blockShulkerBoxMagenta.id, blockShulkerBoxBrown.id,
        blockShulkerBoxGray.id, blockShulkerBoxLightGray.id, blockShulkerBoxBlack.id, blockShulkerBoxWhite.id,
        blockShulkerBoxPink.id]
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
      if (blockShulkerBoxes.includes(id)) {
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
  serv.onBlockInteraction('chest', chestsBlockInteractionHandler)
  serv.onBlockInteraction('ender_chest', chestsBlockInteractionHandler)
  // Shulker boxes
  serv.onBlockInteraction('shulker_box', chestsBlockInteractionHandler)
  serv.onBlockInteraction('red_shulker_box', chestsBlockInteractionHandler)
  serv.onBlockInteraction('orange_shulker_box', chestsBlockInteractionHandler)
  serv.onBlockInteraction('yellow_shulker_box', chestsBlockInteractionHandler)
  serv.onBlockInteraction('lime_shulker_box', chestsBlockInteractionHandler)
  serv.onBlockInteraction('green_shulker_box', chestsBlockInteractionHandler)
  serv.onBlockInteraction('light_blue_shulker_box', chestsBlockInteractionHandler)
  serv.onBlockInteraction('cyan_shulker_box', chestsBlockInteractionHandler)
  serv.onBlockInteraction('blue_shulker_box', chestsBlockInteractionHandler)
  serv.onBlockInteraction('purple_shulker_box', chestsBlockInteractionHandler)
  serv.onBlockInteraction('magenta_shulker_box', chestsBlockInteractionHandler)
  serv.onBlockInteraction('brown_shulker_box', chestsBlockInteractionHandler)
  serv.onBlockInteraction('gray_shulker_box', chestsBlockInteractionHandler)
  serv.onBlockInteraction('light_gray_shulker_box', chestsBlockInteractionHandler)
  serv.onBlockInteraction('black_shulker_box', chestsBlockInteractionHandler)
  serv.onBlockInteraction('white_shulker_box', chestsBlockInteractionHandler)
  serv.onBlockInteraction('pink_shulker_box', chestsBlockInteractionHandler)
}
