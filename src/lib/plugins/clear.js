module.exports.server = (serv, { version }) => {
  const mcData = require('minecraft-data')(version)
  serv.commands.add({
    base: 'clear',
    info: "Clear a player's inventory.",
    usage: '/clear <player> <item> <maxCount>',
    parse: /^(\w+)?(?: (\w+))?(?: (\d+))?$/, // ex: /clear USERNAME_ stone 1
    action (params, ctx) {
      if (typeof params === 'string') { // the parsing failed so it just returned initial input
        return `${this.usage}: ${this.info}`
      }

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
    // https://wiki.vg/Protocol#Set_Slot & https://minecraft-data.prismarine.js.org/?d=protocol#toClient_set_slot
    if (blockType) {
      if (count) {
        const BLOCK_ID = mcData.blocksByName[blockType].id
        return player.inventory.clear(BLOCK_ID, count)
      } else {
        const BLOCK_ID = mcData.blocksByName[blockType].id
        return player.inventory.clear(BLOCK_ID)
      }
    } else {
      return player.inventory.clear()
    }
  }
}
