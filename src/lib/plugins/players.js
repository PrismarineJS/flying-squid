module.exports.server = function (serv) {
  serv.entityMaxId = 0
  serv.players = []
  serv.uuidToPlayer = {}
  serv.entities = {}

  serv.getPlayer = username => {
    const found = serv.players.filter(pl => pl.username === username)
    if (found.length > 0) { return found[0] }
    return null
  }
}

module.exports.player = function (player, serv) {
  player.commands.add({
    base: 'gamemode',
    aliases: ['gm'],
    info: 'to change game mode',
    usage: '/gamemode <0-3>',
    op: true,
    parse (str) {
      if (!str.match(/^([0-3])$/)) { return false }
      return parseInt(str)
    },
    action (mode) {
      player.setGameMode(mode)
    }
  })

  player.commands.add({
    base: 'difficulty',
    aliases: ['diff'],
    info: 'Sets the difficulty level',
    usage: '/difficulty <difficulty>',
    op: true,
    parse (str) {
      if (!str.match(/^([0-3])$/)) { return false }
      return parseInt(str)
    },
    action (diff) {
      serv._writeAll('difficulty', { difficulty: diff })
      serv.difficulty = diff
    }
  })
}
