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
  // Showing container GUI
  const openContainerGUI = (block, player, guiType, title, sound) => {
    // Default GUI shape and content
    const guiContent = [
      { present: false }, { present: false }, { present: false }, { present: false }, { present: false }, { present: false }, { present: false }, { present: false }, { present: false },
      { present: false }, { present: false }, { present: false }, { present: false }, { present: false }, { present: false }, { present: false }, { present: false }, { present: false },
      { present: false }, { present: false }, { present: false }, { present: false }, { present: false }, { present: false }, { present: false }, { present: false }, { present: false }]
    const invType = 2 // 3 rows, 9 slots
    // Filling the GUI content and reshaping the GUI (if necessary)
    switch (guiType) {
      case 'chest':
        // TODO: Gathering of content (NOT IMPLEMENTED)
        break
      case 'double_chest':
        // TODO: Gathering of content (NOT IMPLEMENTED)
        break
      case 'ender_chest':
        // TODO: Gathering of content (NOT IMPLEMENTED)
        break
      case 'shulker_box':
        // TODO: Gathering of content (NOT IMPLEMENTED)
        break
      // TODO: Add more GUIs
    }
    if (sound) {
      // Playing provided sound
      serv.playSound(sound, player.world, block.position, {})
    }
    // Opening container GUI window
    player._client.write('open_window', {
      windowId: player.windowId,
      inventoryType: invType,
      windowTitle: JSON.stringify(title)
    })
    // Sending container content
    player._client.write('window_items', {
      windowId: player.windowId,
      stateId: 1,
      items: guiContent,
      carriedItem: { present: false }
    })
  }
  // Interaction with a container block
  const containerBlockInteractionHandler = async ({ block, player }) => {
    if (player.crouching) return
    try {
      // Getting current block and block above it
      const id = await player.world.getBlockType(block.position)
      const blockAbove = await player.world.getBlockType(block.position.plus(new Vec3(0, 1, 0)))
      // If there is any block directly above container then we can't open it
      if (blockAbove) { return }
      // Dynamic window ID feature
      if (player.windowId === undefined) { player.windowId = 1 } else { player.windowId = player.windowId + 1 }
      player.windowPos = block.position
      if (id === blockChest.id) {
        player.windowType = 'chest'
        openContainerGUI(block, player, 'chest', { translate: 'container.chest' }, 'block.chest.open')
        return true
      }
      if (id === blockEnderChest.id) {
        player.windowType = 'ender_chest'
        openContainerGUI(block, player, 'ender_chest', { translate: 'container.enderchest' }, 'block.chest.open')
        return true
      }
      // TODO: Large chest (NOT IMPLEMENTED)
      if (blockShulkerBox.includes(id)) {
        player.windowType = 'shulker_box'
        openContainerGUI(block, player, 'shulker_box', { translate: 'container.shulkerBox' }, 'block.chest.open')
        return true
      }
    } catch (err) {
      setTimeout(() => { throw err }, 0)
    }
  }
  // Registering block interaction handlers
  // Chests
  serv.onBlockInteraction(mcData.blocksByName.chest.name, containerBlockInteractionHandler)
  serv.onBlockInteraction(mcData.blocksByName.ender_chest.name, containerBlockInteractionHandler)
  // TODO: Large chest (NOT IMPLEMENTED)
  // Shulker boxes
  if (serv.supportFeature('theShulkerBoxes')) {
    for (const currentShulkerBoxID of blockShulkerBox) {
      serv.onBlockInteraction(mcData.blocks[currentShulkerBoxID].name, containerBlockInteractionHandler)
    }
  }
}
