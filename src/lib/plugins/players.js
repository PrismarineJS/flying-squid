const UserError = require('../user_error')

module.exports.server = function (serv, { version }) {
  const Item = require('prismarine-item')(version)
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
    usage: '/gamemode <mode> [player]',
    op: true,
    parse (str, ctx) {
      const paramsSplit = str.split(' ')
      if (paramsSplit[0] === '') {
        return false
      }
      if (!paramsSplit[0].match(/^(survival|creative|adventure|spectator|[0-3])$/)) {
        throw new UserError(`The gamemode you have entered (${paramsSplit[0]}) is not valid, it must be survival, creative, adventure, spectator, or a number from 0-3`)
      }
      if (!paramsSplit[1]) {
        if (ctx.player) return paramsSplit[0].match(/^(survival|creative|adventure|spectator|[0-3])$/)
        else throw new UserError('Console cannot set gamemode itself')
      }

      return str.match(/^(survival|creative|adventure|spectator|[0-3]) (\w+)$/) || false
      // return params || false
    },
    action (str, ctx) {
      const gamemodes = {
        survival: 0,
        creative: 1,
        adventure: 2,
        spectator: 3
      }
      const gamemodesReverse = Object.assign({}, ...Object.entries(gamemodes).map(([k, v]) => ({ [v]: k })))
      const gamemode = parseInt(str[1], 10) || gamemodes[str[1]]
      const mode = parseInt(str[1], 10) ? gamemodesReverse[parseInt(str[1], 10)] : str[1]
      const plyr = serv.getPlayer(str[2])
      if (ctx.player) {
        if (str[2]) {
          if (plyr !== null) {
            plyr.setGameMode(gamemode)
            return `Set ${str[2]}'s game mode to ${mode} Mode`
          } else {
            throw new UserError(`Player '${str[2]}' cannot be found`)
          }
        } else ctx.player.setGameMode(gamemode)
      } else {
        if (plyr !== null) {
          plyr.setGameMode(gamemode)
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
      serv._writeAll('difficulty', { difficulty: diff, difficultyLocked: false })
      serv.difficulty = diff
    }
  })

  serv.commands.add({
    base: 'give',
    info: 'Gives an item to a player.',
    usage: '/give <player> <item> [count]',
    tab: ['player', 'number', 'number'],
    op: true,
    parse (args) {
      args = args.split(' ')
      if (args[0] === '') return false
      if (!serv.getPlayer(args[0])) throw new UserError('Player is not found')
      if (args[2] && !args[2].match(/\d/)) throw new UserError('Count must be numerical')
      return {
        player: serv.getPlayer(args[0]),
        item: args[1],
        count: args[2] ? args[2] : 1
      }
    },
    action ({ player, item, count }, ctx) {
      const newItem = new Item(item, count)

      player.inventory.slots.forEach((e, i) => {
        if (!e) return
        if (e.type === parseInt(newItem.type)) {
          e.count += parseInt(count)
          player.inventory.updateSlot(e.slot, e)
          return true
        }

        if (player.inventory.slots.length === i) {
          player.inventory.updateSlot(player.inventory.firstEmptyInventorySlot(), newItem)
        }
      })

      if (player.inventory.items().length === 0) {
        player.inventory.updateSlot(player.inventory.firstEmptyInventorySlot(), newItem)
      }
    }
  })
}
