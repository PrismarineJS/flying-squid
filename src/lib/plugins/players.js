const { supportedVersions } = require('../version')

const UserError = require('flying-squid').UserError

module.exports.server = function (serv, { version }) {
  const Item = require('prismarine-item')(version)
  const mcData = require('minecraft-data')(version)
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
    const found = serv.players.filter(pl => pl.username === username ||
      pl.username === username.toLowerCase() ||
      pl.username.toLowerCase() === username ||
      pl.username === username.toUpperCase() ||
      pl.username.toUpperCase() === username)
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
      const paramsSplit = str.split(' ')

      let msgs
      if (supportedVersions.indexOf(version) < 5) {
        msgs = {
          invalid: {
            translate: 'commands.generic.num.invalid', // no gamemode error... soo..
            with: [String(paramsSplit[0])]
          },
          playerPerm: {
            translate: 'commands.generic.player.unspecified'
          }
        }
      } else {
        msgs = {
          invalid: {
            translate: 'argument.entity.options.mode.invalid',
            with: [String(paramsSplit[0])]
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
      const gamemodesTranslated = {
        survival: { translate: 'gameMode.survival' },
        creative: { translate: 'gameMode.creative' },
        adventure: { translate: 'gameMode.adventure' },
        changed: { translate: 'gameMode.changed' }
      }

      const gamemodes = {
        survival: 0,
        creative: 1,
        adventure: 2,
        spectator: 3
      }
      const gamemodesReverse = Object.assign({}, ...Object.entries(gamemodes).map(([k, v]) => ({ [v]: k })))
      const gamemode = parseInt(str[1], 10) || gamemodes[str[1]]
      const mode = parseInt(str[1], 10) ? gamemodesReverse[parseInt(str[1], 10)] : str[1]
      const plyr = serv.getPlayerCaseInsensetive(str[2])

      const msgs = {
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

      let playerNotFound
      if (supportedVersions.indexOf(version) < 5) {
        playerNotFound = {
          translate: 'commands.generic.player.notFound',
          with: [String(str[2])]
        }
      } else {
        playerNotFound = {
          translate: 'argument.entity.notfound.player',
          with: [String(str[2])]
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

      const playerNotFound = {
        translate: supportedVersions.indexOf(version) < 5 ? 'commands.generic.player.notFound' : 'argument.entity.notfound.player',
        with: [String(args[0])]
      }
      const numInvalid = {
        translate: supportedVersions.indexOf(version) < 5 ? 'commands.generic.num.invalid' : 'parsing.int.invalid',
        with: [String(args[2])]
      }

      if (args[0] === '') return false
      if (!serv.getPlayerCaseInsensetive(args[0])) throw new UserError(playerNotFound)
      if (args[2] && !args[2].match(/\d/)) throw new UserError(numInvalid)
      return {
        player: serv.getPlayerCaseInsensetive(args[0]),
        item: args[1],
        count: args[2] ? args[2] : 1
      }
    },
    action ({ player, item, count }, ctx) {
      const newItem = new Item(item, count)

      let unknownId
      if (supportedVersions.indexOf(version) < 5) {
        unknownId = {
          translate: 'commands.give.item.notFound',
          with: [item]
        }
      } else {
        unknownId = {
          translate: 'argument.id.unknown',
          with: [item]
        }
      }

      if (newItem.name === 'unknown') throw new UserError(unknownId)

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

      let translatedItemName
      if (supportedVersions.indexOf(version) > 5) {
        const isBlock = mcData.blocksByName[newItem.name] !== undefined
          ? mcData.blocksByName[newItem.name]
          : mcData.itemsByName[newItem.name]

        translatedItemName = {
          translate: `${isBlock ? 'block' : 'item'}.minecraft.${newItem.name}`
        }
      } else {
        const camelCaseId = newItem.name.replace(/(_\w)/g, function (k) { return k[1].toUpperCase() })

        translatedItemName = {
          translate: `item.${camelCaseId}.name`
        }
      }

      const success = {
        translate: supportedVersions.indexOf(version) < 5 ? 'commands.give.success' : 'commands.give.success.single',
        with: [
          String(count),
          Object.assign(translatedItemName,
            {
              hoverEvent: {
                action: 'show_item',
                contents: {
                  id: newItem.name,
                  count: parseInt(newItem.count),
                  tag: JSON.stringify(newItem.count)
                }
              }
            }),
          player.username]
      }

      return success
    }
  })
}
