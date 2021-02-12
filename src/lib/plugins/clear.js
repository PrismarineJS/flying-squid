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
    parse: /^(\w+)?(?: (\w+))?(?: (\d+))?$/, // ex: /clear USERNAME_ stone 1
    action (params, ctx) {
      if (typeof params === 'string') { // the parsing failed so it just returned initial input
        return `${this.usage}: ${this.info}`
      }

      Item = require('prismarine-item')(version)
      mcData = require('minecraft-data')(version)
      // if the ctx.player doesn't exist, it's console executing the command
      const executingPlayer = ctx.player
      const wantedUsername = params[1] || undefined
      const isOp = ctx.player ? ctx.player.op : true
      if (isOp) { // only op can clear other's inventories
        if (wantedUsername) {
          if (!mcData.blocksByName[params[2]]) { // block invalid
            return 'The block given is invalid.'
          } else {
            if (params[3] && isNaN(parseInt(params[3]))) { // count invalid
              return 'The number of blocks to remove given is invalid.'
            } else { // everything valid not defined
              const blocksCleared = clearInventory(serv.getPlayer(wantedUsername), params[2], parseInt(params[3]))
              return `Removed ${blocksCleared} items from player ${wantedUsername}`
            }
          }
        } else {
          if (executingPlayer) { // player executing on themselves
            const blocksCleared = clearInventory(executingPlayer, undefined, undefined)
            return `Removed ${blocksCleared} items from player ${executingPlayer.username}`
          } else { // console executing with no player arg
            return 'This command must be used on a player.'
          }
        }
      } else {
        const blocksCleared = clearInventory(executingPlayer, undefined, undefined)
        return `Removed ${blocksCleared} from player ${executingPlayer.username}`
      }
    }
  })

  function clearInventory (player, blockType, count) {
    const AIR_ITEM = null
    const PACKET_NAME = 'set_slot' // https://wiki.vg/Protocol#Set_Slot & https://minecraft-data.prismarine.js.org/?d=protocol#toClient_set_slot
    const playerArray = [player]
    let clearedCount = 0
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
          const blocksNeeded = count - currCount
          if (currSlot?.type === BLOCK_ID) {
            if (currSlot.count > blocksNeeded) { // stack is bigger then needed
              partial.item = new Item(BLOCK_ID, currSlot.count - blocksNeeded, currSlot.metadata, currSlot.nbt)
              partial.used = true
              partial.slot = i

              currCount += blocksNeeded
              clearedCount += blocksNeeded
              slots.push(i)
              break // we have enough items
            } else if (currSlot.count === blocksNeeded) { // stack is just big enough
              currCount += currSlot.count
              clearedCount += currSlot.count
              slots.push(i)
              break // we have enough items
            } else { // too little items to finish counter
              currCount += currSlot.count
              clearedCount += currSlot.count
              slots.push(i)
            }
          }
        }
        // check inventory
        if (currCount !== count) {
          for (let i = player.inventory.inventoryStart; i < player.inventory.inventoryEnd - 1; i++) {
            const currSlot = player.inventory.slots[i]
            const blocksNeeded = count - currCount
            if (currSlot?.type === BLOCK_ID) {
              if (currSlot.count > blocksNeeded) { // stack is bigger then needed
                partial.item = new Item(BLOCK_ID, currSlot.count - (blocksNeeded), currSlot.metadata, currSlot.nbt)
                partial.used = true
                partial.slot = i

                currCount += blocksNeeded
                clearedCount += blocksNeeded
                slots.push(i)
                break // we have enough items
              } else if (currSlot.count === blocksNeeded) { // stack is just big enough
                currCount += currSlot.count
                clearedCount += currSlot.count
                slots.push(i)
                break // we have enough items
              } else { // too little items to finish counter
                currCount += currSlot.count
                clearedCount += currSlot.count
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
          player.inventory.updateSlot(slot, AIR_ITEM)
        }
        if (partial.used) {
          serv._writeArray(PACKET_NAME, {
            windowId: 0,
            slot: partial.slot,
            item: Item.toNotch(partial.item)
          }, playerArray)
          player.inventory.updateSlot(partial.slot, partial.item)
        }

        return clearedCount
        // implement picking which stacks to take from
        // serv._writeArray(packetName, packetFields, playerArray)
      } else {
        const BLOCK_ID = mcData.blocksByName[blockType].id
        const blocks = player.inventory.slots
          .filter(x => x != null) // get rid of nulls
          .filter(x => x.type === BLOCK_ID)
        const totalBlocksCleared = blocks.reduce((accumulator, currentValue) => accumulator + currentValue.count, 0)
        for (const { slot } of blocks) {
          serv._writeArray(PACKET_NAME, {
            windowId: 0,
            slot: slot,
            item: Item.toNotch(AIR_ITEM)
          }, playerArray)
          player.inventory.updateSlot(slot, AIR_ITEM)
        }
        return totalBlocksCleared
      }
    } else {
      const blocks = player.inventory.slots
        .filter(x => x != null)
      const totalBlocksCleared = blocks.reduce((accumulator, currentValue) => accumulator + currentValue.count, 0)
      for (const { slot } of blocks) {
        serv._writeArray(PACKET_NAME, {
          windowId: 0,
          slot: slot,
          item: Item.toNotch(AIR_ITEM)
        }, playerArray)
        player.inventory.updateSlot(slot, AIR_ITEM)
      }
      return totalBlocksCleared
    }
  }
}
