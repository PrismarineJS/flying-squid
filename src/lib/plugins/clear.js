const { player } = require('./login')

module.exports.server = (serv, { version }) => {
  const mcData = require('minecraft-data')(version)
  const ChatMessage = require('prismarine-chat')(version)
  serv.commands.add({
    base: 'clear',
    info: 'Clears items from player(s) inventory.',
    usage: '/clear <player> <item> <maxCount>',
    parse: /^((?:@|\w)+)?(?: (\w+))?(?: (\d+))?$/, // ex: /clear USERNAME_ stone 1
    action (params, ctx) {
      const playersString = (players) => players.length > 1 ? `${players.length} players` : `player ${players[0].username}`
      const isConsole = Object.entries(ctx).length === 0
      const isOp = isConsole ? true : ctx.player.op
      const notUdf = (x) => x !== undefined
      console.log()
      if (typeof params === 'string') return `${this.usage}: ${this.info}` // parsing failed
      if (isConsole && !notUdf(params[1])) return 'A player is required to run this command here' // console
      if (!isOp && notUdf(params[1])) return 'Command not found'
      if (notUdf(params[2]) && !mcData.itemsByName[params[2]]) return 'The block given is invalid.'
      if (notUdf(params[3]) && isNaN(parseInt(params[3]))) return 'The number of blocks to remove given is invalid.'
      let playerInput
      if (isConsole) playerInput = [[undefined, serv.getPlayer(params[1])]]
      else if (notUdf(params[1])) playerInput = Object.entries(serv.parseSelectorString(params[1], ctx.player.position, ctx.player.world))
      else playerInput = [[undefined, ctx.player]]
      const players = playerInput.map(p => p[1])
      if (players.some(player => player == null)) return "Player given doesn't exist"
      const id = params[2] ? mcData.itemsByName[params[2]].id : null
      // also clear held item if players are in survival
      const blocksCleared = players.reduce((accumulator, player) => {
        const res = player.inventory.clear(id, params[3] ? parseInt(params[3]) : undefined)
        return accumulator + res
      }, 0)
      if (blocksCleared === 0) return `No items were found on ${playersString(players)}`
      let serverMessage
      if (!isConsole && players.length > 1) serverMessage = execByUserToUsers(ctx.player.username, ctx.player.uuid, blocksCleared, players.length)
      else if (!isConsole && players.length === 1) serverMessage = execByUserToUser(ctx.player.username, ctx.player.uuid, blocksCleared, players[0].username, players[0].uuid)
      else if (isConsole && players.length > 1) serverMessage = execByConsoleToUsers(blocksCleared, players.length)
      else if (isConsole && players.length === 1) serverMessage = execByConsoleToUser(blocksCleared, players[0].username, players[0].uuid)
      serv.sendChatMessage(isConsole ? 'Server' : ctx.player.username, isConsole, serverMessage, false)
      return `Removed ${blocksCleared} items from ${playersString(players)}`
    }
  })

  function execByUserToUsers (doneBy, doneByUUID, count, playerCount) {
    return new ChatMessage({
      italic: true,
      color: 'gray',
      translate: 'chat.type.admin',
      with: [
        {
          insertion: doneBy,
          clickEvent: {
            action: 'suggest_command',
            value: `/tell ${doneBy} `
          },
          hoverEvent: {
            action: 'show_entity',
            contents: {
              type: 'minecraft:player',
              id: doneByUUID,
              name: {
                text: doneBy
              }
            }
          },
          text: doneBy
        },
        {
          translate: 'commands.clear.success.multiple',
          with: [
            count,
            playerCount
          ]
        }
      ]
    })
  }

  function execByUserToUser (doneBy, doneByUUID, count, toUser, toUserUUID) {
    return new ChatMessage({
      italic: true,
      color: 'gray',
      translate: 'chat.type.admin',
      with: [
        {
          insertion: doneBy,
          clickEvent: {
            action: 'suggest_command',
            value: `/tell ${doneBy} `
          },
          hoverEvent: {
            action: 'show_entity',
            contents: {
              type: 'minecraft:player',
              id: doneByUUID,
              name: {
                text: doneBy
              }
            }
          },
          text: doneBy
        },
        {
          translate: 'commands.clear.success.single',
          with: [
            count,
            {
              insertion: toUser,
              clickEvent: {
                action: 'suggest_command',
                value: `/tell ${toUser} `
              },
              hoverEvent: {
                action: 'show_entity',
                contents: {
                  type: 'minecraft:player',
                  id: toUserUUID,
                  name: {
                    text: toUser
                  }
                }
              },
              text: toUser
            }
          ]
        }
      ]
    })
  }

  function execByConsoleToUsers (count, playerCount) {
    return new ChatMessage({
      italic: true,
      color: 'gray',
      translate: 'chat.type.admin',
      with: [
        {
          text: 'Server'
        },
        {
          translate: 'commands.clear.success.multiple',
          with: [
            count,
            playerCount
          ]
        }
      ]
    })
  }

  function execByConsoleToUser (count, toUser, toUserUUID) {
    return new ChatMessage({
      italic: true,
      color: 'gray',
      translate: 'chat.type.admin',
      with: [
        {
          text: 'Server'
        },
        {
          translate: 'commands.clear.success.single',
          with: [
            count,
            {
              insertion: toUser,
              clickEvent: {
                action: 'suggest_command',
                value: `/tell ${toUser} `
              },
              hoverEvent: {
                action: 'show_entity',
                contents: {
                  type: 'minecraft:player',
                  id: toUserUUID,
                  name: {
                    text: toUser
                  }
                }
              },
              text: toUser
            }
          ]
        }
      ]
    })
  }
}
