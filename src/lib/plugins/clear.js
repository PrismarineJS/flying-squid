module.exports.server = (serv, { version }) => {
  const mcData = require('minecraft-data')(version)
  serv.commands.add({
    base: 'clear',
    info: 'Clears items from player(s) inventory.',
    usage: '/clear <player> <item> <maxCount>',
    parse: /^((?:@|\w)+)?(?: (\w+))?(?: (\d+))?$/, // ex: /clear USERNAME_ stone 1
    action (params, ctx) {
      const playersString = (players) => players.length > 1 ? `${players.length} players` : `player ${players[0].username}`

      if (typeof params === 'string') return `${this.usage}: ${this.info}` // parsing failed
      const isOp = ctx.player ? ctx.player.op : true
      if (!isOp && params[1]) return 'Command not found'
      if (params[2] && !mcData.itemsByName[params[2]]) return 'The block given is invalid.'
      if (params[3] && isNaN(parseInt(params[3]))) return 'The number of blocks to remove given is invalid.'
      const playerInput = params[1]
        ? Object.entries(serv.parseSelectorString(params[1], ctx.player.position, ctx.player.world))
        : [[0, ctx.player]]
      const players = playerInput.map(p => p[1])
      if (players.some(player => !player)) return "Player given doesn't exist"
      const id = params[2] ? mcData.itemsByName[params[2]].id : null
      // also clear held item if players are in survival
      const blocksCleared = players.reduce((accumulator, player) => {
        const res = player.inventory.clear(id, params[3] ? parseInt(params[3]) : undefined)
        return accumulator + res
      }, 0)
      if (blocksCleared === 0) return `No items were found on ${playersString(players)}`
      return `Removed ${blocksCleared} items from ${playersString(players)}`
    }
  })
}
