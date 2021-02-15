module.exports.server = (serv, { version }) => {
  const mcData = require('minecraft-data')(version)
  const ChatMessage = require('prismarine-chat')(version)
  const notUdf = x => x !== undefined
  const playersString = players => players.length > 1 ? `${players.length} players` : `player ${players[0].username}`
  serv.commands.add({
    base: 'clear',
    info: 'Clears items from player(s) inventory.',
    usage: '/clear <player> <item> <maxCount>',
    parse: /^((?:@|\w)+)?(?: (\w+))?(?: (\d+))?$/, // ex: /clear USERNAME_ stone 1
    action (params, ctx) {
      const isConsole = Object.entries(ctx).length === 0
      const isOp = isConsole ? true : ctx.player.op
      const [, playerSelector, removeBlockId, removeCount] = params
      // errors
      if (typeof params === 'string') return `${this.usage}: ${this.info}` // parsing failed
      if (isConsole && playerSelector === undefined) return 'A player is required to run this command here' // console
      if (!isOp && notUdf(playerSelector)) return 'Command not found'
      if (notUdf(removeBlockId) && !mcData.itemsByName[removeBlockId]) return `Unknown item tag'${removeBlockId}'`
      if (notUdf(removeCount) && isNaN(parseInt(removeCount))) return 'The number of blocks to remove given is invalid.'
      // player(s) to execute on
      let players
      if (isConsole) {
        players = [serv.getPlayer(playerSelector)]
      } else if (notUdf(playerSelector)) {
        players = Object.entries(serv.parseSelectorString(playerSelector, ctx.player.position, ctx.player.world)).map(p => p[1])
      } else { // no input given (so default to executor)
        players = [ctx.player]
      }
      if (players.some(player => player == null)) return "Player given doesn't exist"
      const id = removeBlockId ? mcData.itemsByName[removeBlockId].id : null
      // also clear held item if players are in survival
      const blocksCleared = players.reduce((totalRemoved, player) => {
        const currRemoved = player.inventory.clear(id, removeCount ? parseInt(removeCount) : undefined)
        return totalRemoved + currRemoved
      }, 0)
      if (blocksCleared === 0) return `No items were found on ${playersString(players)}`
      let serverMessage
      if (isConsole) {
        if (players.length > 1) {
          serverMessage = execByConsoleToUsers(blocksCleared, players.length)
        } else {
          serverMessage = execByConsoleToUser(blocksCleared, players[0].username, players[0].uuid)
        }
      } else {
        if (players.length > 1) {
          serverMessage = execByUserToUsers(ctx.player.username, ctx.player.uuid, blocksCleared, players.length)
        } else {
          serverMessage = execByUserToUser(ctx.player.username, ctx.player.uuid, blocksCleared, players[0].username, players[0].uuid)
        }
      }
      serv.sendChatMessage(serverMessage, {
        messageType: 'system',
        execByUUID: isConsole ? undefined : ctx.player.uuid,
        isConsole
      })
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
