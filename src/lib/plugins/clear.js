module.exports.server = (serv, { version }) => {
  const mcData = require('minecraft-data')(version)
  serv.commands.add({
    base: 'clear',
    info: "Clear a player's inventory.",
    usage: '/clear <player> <item> <maxCount>',
    parse: /^(\w+)?(?: (\w+))?(?: (\d+))?$/, // ex: /clear USERNAME_ stone 1
    action (params, ctx) {
      if (typeof params === 'string') return `${this.usage}: ${this.info}` // parsing failed
      const isOp = ctx.player ? ctx.player.op : true
      if (!isOp && params[1]) return 'Command not found'
      if (params[2] && !mcData.blocksByName[params[2]]) return 'The block given is invalid.'
      if (params[3] && isNaN(parseInt(params[3]))) return 'The number of blocks to remove given is invalid.'
      const player = params[1] ? serv.getPlayer(params[1]) : ctx.player
      if (!player) return "Player given doesn't exist"
      const id = params[2] ? mcData.blocksByName[params[2]].id : null
      const blocksCleared = player.inventory.clear(id, params[3] ? parseInt(params[3]) : undefined)
      return `Removed ${blocksCleared} items from player ${params[1] || ctx.player.username}`
    }
  })
}
