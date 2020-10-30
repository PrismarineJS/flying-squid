const { supportedVersions } = require('../version')

const UserError = require('flying-squid').UserError

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

  serv.getPlayerCaseInsensetive = username => {
    if (!username) return null
    const found = serv.players.filter(pl => pl.username === username 
      || pl.username === username.toLowerCase() 
      || pl.username.toLowerCase() === username
      || pl.username === username.toUpperCase() 
      || pl.username.toUpperCase() === username)
    if (found.length > 0) { return found[0] }
    return null
  }

  // TODO
  serv.commands.add({
    base: 'gamemode',
    aliases: ['gm'],
    info: 'to change game mode',
    usage: '/gamemode <mode> [player]',
    op: true,
    parse (str, ctx) {
      var paramsSplit = str.split(' ')

      let msgs
      if (supportedVersions.indexOf(version) < 5) {
        msgs = {
          invalid: {
            translate: 'commands.generic.num.invalid', // no gamemode error... soo..
            with: [ String(paramsSplit[0]) ]
          },
          playerPerm: {
            translate: 'commands.generic.player.unspecified'
          }
        }
      } else {
        msgs = {
          invalid: {
            translate: 'argument.entity.options.mode.invalid',
            with: [ String(paramsSplit[0]) ]
          },
          playerPerm: {
            translate: 'permissions.requires.player'
          }
        }
      }

      if (paramsSplit[0] === '') {
        return false
      }
      if (!paramsSplit[0].match(/^(survival|creative|adventure|spectator|[0-3])$/)) {
        throw new UserError(msgs.invalid)
      }
      if (!paramsSplit[1]) {
        if (ctx.player) return paramsSplit[0].match(/^(survival|creative|adventure|spectator|[0-3])$/)
        else throw new UserError(msgs.playerPerm)
      }

      return str.match(/^(survival|creative|adventure|spectator|[0-3]) (\w+)$/) || false
      // return params || false
    },
    action (str, ctx) {
      var gamemodesTranslated = {
        survival: { translate: 'gameMode.survival' },
        creative: { translate: 'gameMode.creative' },
        adventure: { translate: 'gameMode.adventure' },
        changed: { translate: 'gameMode.changed' }
      }

      var gamemodes = {
        survival: 0,
        creative: 1,
        adventure: 2,
        spectator: 3
      }
      var gamemodesReverse = Object.assign({}, ...Object.entries(gamemodes).map(([k, v]) => ({ [v]: k })))
      var gamemode = parseInt(str[1], 10) || gamemodes[str[1]]
      var mode = parseInt(str[1], 10) ? gamemodesReverse[parseInt(str[1], 10)] : str[1]
      var plyr = serv.getPlayerCaseInsensetive(str[2])

      var msgs = {
        self: {
          translate: 'commands.gamemode.success.self',
          with: [{
            ...gamemodesTranslated[mode],
            color: 'gray',
            italic: 'true'
          }]
        }, 
        other: {
          translate: 'commands.gamemode.success.other',
          with: [{
            ...gamemodesTranslated[mode],
            color: 'gray',
            italic: 'true'
          }]
        }
      }

      var playerNotFound
      if (supportedVersions.indexOf(version) < 5) {
        playerNotFound = {
          translate: 'commands.generic.player.notFound',
          with: [ String(str[2]) ]
        }
      } else {
        playerNotFound = {
          translate: 'argument.entity.notfound.player',
          with: [ String(str[2]) ]
        }
      }

      if (ctx.player) {
        if (str[2]) {
          if (plyr !== null) {
            plyr.setGameMode(gamemode)
            return msgs.other
          }

          throw new UserError(playerNotFound)
        }

        ctx.player.setGameMode(gamemode)
        return msgs.self
      } else {
        if (plyr !== null) {
          plyr.setGameMode(gamemode)
          return msgs.other
        } 

        throw new UserError(playerNotFound)
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
        if (e === undefined) return
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
