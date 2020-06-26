const UserError = require('flying-squid').UserError

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

  serv.commands.add({
    base: 'gamemode',
    aliases: ['gm'],
    info: 'to change game mode',
    usage: '/gamemode <0-3> [player]',
    op: true,
    parse (str) {
      var paramsSplit = str.split(' ')
      if (paramsSplit[0] === '') {
        return false
      }
      if (!paramsSplit[0].match(/([0-3])$/) && paramsSplit[0].match(/([4-9])$/)) {
        throw new UserError(`The number you have entered (${paramsSplit[0]}) is too big, it must be at most 3`)
      }
      if (!paramsSplit[1]) {
        return paramsSplit[0].match(/([0-3])$/)
      }

      return str.match(/([0-3]) (\w+)/) || false
      // return params || false
    },
    action (str, ctx) {
      var gamemodes = {
        0: 'Survival',
        1: 'Creative',
        2: 'Adventure',
        3: 'Spectator'
      }
      var mode = gamemodes[str[1]]
      var plyr = serv.getPlayer(str[2])
      if (ctx.player) {
        if (str[2]) {
          if (plyr !== null) {
            plyr.setGameMode(str[1])
            return `Set ${str[2]}'s game mode to ${mode} Mode`
          } else {
            throw new UserError(`Player '${str[2]}' cannot be found`)
          }
        } else ctx.player.setGameMode(str[1])
      } else {
        if (plyr !== null) {
          plyr.setGameMode(str[1])
          return `Set ${str[2]}'s game mode to ${mode} Mode`
        } else {
          throw new UserError(`Player '${str[2]}' cannot be found`)
        }
      }
    }
  })

  serv.commands.add({
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
