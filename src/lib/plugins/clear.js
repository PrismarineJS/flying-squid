// params format:
// 0: initial match
// 1: ign
// 2: block
// 3: number of blocks to remove
let Item
let mcData

module.exports.server = (serv, { version }) => {
  serv.commands.add({
    base: 'clear',
    info: "Clear a player's inventory.",
    usage: '/clear <player> <item> <maxCount>',
    parse: /(?:(\w+)(?: (\w+)(?: (\d+))?)?)?/, // ex: /clear USERNAME_ stone 1
    action (params, ctx) {
      Item = require('prismarine-item')(version)
      mcData = require('minecraft-data')(version)
      // if the ctx.player doesn't exist, it's console executing the command
      const executingPlayer = ctx.player
      const wantedUsername = params[1] || undefined
      const isOp = ctx.player ? ctx.player.op : true
      if (isOp) { // only op can clear other's inventories
        if (wantedUsername) {
          if (!mcData.blocksByName[params[2]]) {
            console.log()
            // send the player a message the block name is invalid
          } else {
            if (isNaN(parseInt(params[3]))) {
              // handle if the number of blocks the user gives isn't a number
            }
            clearInventory(serv.getPlayer(wantedUsername), params[2], parseInt(params[3]))
          }
        } else {
          clearInventory(executingPlayer, undefined, undefined)
        }
      } else {
        clearInventory(executingPlayer, undefined, undefined)
      }
    }
  })

  function clearInventory (player, blockType, count) {
    const AIR_ITEM = new Item(0, 0)
    const PACKET_NAME = 'set_slot' // https://wiki.vg/Protocol#Set_Slot & https://minecraft-data.prismarine.js.org/?d=protocol#toClient_set_slot
    const playerArray = [player]

    if (blockType) {
      if (count) {
        const BLOCK_ID = mcData.blocksByName[blockType].id
        let currCount = 0
        const partial = {
          used: false,
          item: null,
          slot: 0
        }
        const slots = []
        // check hotbar first from right to left
        for (let i = player.inventory.inventoryEnd - 1; i > player.inventory.inventoryEnd - 10; i--) {
          const currSlot = player.inventory.slots[i]
          if (currSlot?.type === BLOCK_ID) {
            if (currSlot.count > (count - currCount)) { // stack is bigger then needed
              partial.item = new Item(BLOCK_ID, currSlot.count - (count - currCount), currSlot.metadata, currSlot.nbt)
              partial.used = true
              partial.slot = i

              currCount += (count - currCount)
              slots.push(i)
              break // we have enough items
            } else if (currSlot.count === (count - currCount)) { // stack is just big enough
              currCount += currSlot.count
              slots.push(i)
              break // we have enough items
            } else { // too little items to finish counter
              currCount += currSlot.count
              slots.push(i)
            }
          }
        }
        // check inventory
        if (currCount !== count) {
          for (let i = player.inventory.inventoryStart; i < player.inventory.inventoryEnd - 1; i++) {
            const currSlot = player.inventory.slots[i]
            if (currSlot?.type === BLOCK_ID) {
              if (currSlot.count > (count - currCount)) { // stack is bigger then needed
                partial.item = new Item(BLOCK_ID, currSlot.count - (count - currCount), currSlot.metadata, currSlot.nbt)
                partial.used = true
                partial.slot = i

                currCount += (count - currCount)
                slots.push(i)
                break // we have enough items
              } else if (currSlot.count === (count - currCount)) { // stack is just big enough
                currCount += currSlot.count
                slots.push(i)
                break // we have enough items
              } else { // too little items to finish counter
                currCount += currSlot.count
                slots.push(i)
              }
            }
          }
        }
        // done getting list of slots to clean
        for (const slot of slots) {
          serv._writeArray(PACKET_NAME, {
            windowId: 0,
            slot: slot,
            item: Item.toNotch(AIR_ITEM)
          }, playerArray)
        }
        if (partial.used) {
          serv._writeArray(PACKET_NAME, {
            windowId: 0,
            slot: partial.slot,
            item: Item.toNotch(partial.item)
          }, playerArray)
        }

        // implement picking which stacks to take from
        // serv._writeArray(packetName, packetFields, playerArray)
      } else {
        const BLOCK_ID = mcData.blocksByName[blockType].id
        const blocksInInventory = player.inventory.slots
          .filter(x => x != null) // get rid of nulls
          .filter(x => x.type === BLOCK_ID)
        for (const { slot } of blocksInInventory) {
          serv._writeArray(PACKET_NAME, {
            windowId: 0,
            slot: slot,
            item: Item.toNotch(AIR_ITEM)
          }, playerArray)
        }
      }
    } else {
      const blocks = player.inventory.slots.filter(x => x != null)
      for (const { slot } of blocks) {
        serv._writeArray(PACKET_NAME, {
          windowId: 0,
          slot: slot,
          item: Item.toNotch(AIR_ITEM)
        }, playerArray)
      }
    }
  }
}
