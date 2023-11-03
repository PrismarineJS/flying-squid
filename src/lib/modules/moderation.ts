import moment from 'moment'
import needle from 'needle'
import UserError from '../user_error'

export const server = function (serv: Server, settings: Options) {
  serv.ban = async (uuid, reason) => {
    if (!serv.bannedPlayers[uuid]) {
      serv.bannedPlayers[uuid] = {
        time: +moment(),
        reason: reason || 'Your account is banned!'
      }
      return true
    } else return false
  }
  serv.banIP = async (IP, reason) => {
    if (!serv.bannedIPs[IP]) {
      serv.bannedIPs[IP] = {
        time: +moment(),
        reason: reason || 'Your IP is banned!'
      }
      Object.keys(serv.players)
        .filter(uuid => serv.players[uuid]._client.socket?.remoteAddress === IP)
        .forEach(uuid => serv.players[uuid].kick(serv.bannedIPs[serv.players[uuid]._client.socket?.remoteAddress].reason))
      return true
    } else return false
  }

  function uuidInParts (plainUUID) {
    return plainUUID.length === 32 ? plainUUID.substring(0, 8) + '-' + plainUUID.substring(8, 12) + '-' + plainUUID.substring(12, 16) + '-' + plainUUID.substring(16, 20) + '-' + plainUUID.substring(20) : plainUUID
  }

  serv.getUUIDFromUsername = async username => {
    return await new Promise((resolve, reject) => {
      needle('get', 'https://api.mojang.com/users/profiles/minecraft/' + username, { json: true })
        .then((response) => {
          if (!response.body) throw new Error('username not found')
          const idstr = response.body.id
          if (typeof idstr !== 'string') throw new Error('username not found')
          resolve(uuidInParts(idstr))
        })
        .catch(err => { throw err })
    })
  }

  serv.banUsername = async (username, reason) => {
    return serv.ban(username, reason)
  }

  serv.banUUID = async (username, reason) => {
    return serv.getUUIDFromUsername(username).then(uuid => serv.ban(uuid, reason))
  }

  serv.pardonUsername = async (username) => {
    return pardon(username)
  }

  serv.pardonUUID = async (username) => {
    return serv.getUUIDFromUsername(username)
      .then(pardon)
  }

  serv.pardonIP = async (IP) => {
    return serv.bannedIPs[IP] ? delete serv.bannedIPs[IP] : false
  }

  function pardon (uuid) {
    if (serv.bannedPlayers[uuid]) {
      delete serv.bannedPlayers[uuid]
      return true
    }
    return false
  }

  serv.bannedPlayers = {}
  serv.bannedIPs = {}

  serv.commands.add({
    base: 'op',
    info: 'Op a player',
    usage: '/op <player>',
    op: true,
    parse (params) {
      if (!params.match(/([a-zA-Z0-9_]+)/)) return false
      return params
    },
    action (params) {
      const [inputUsername] = params.split(' ')
      // get player, by non-case-sensitive username
      const player = serv.players.find(player => player.username.toLowerCase() === inputUsername.toLowerCase())
      if (player === undefined || player === null) {
        const arr = serv.selectorString(params)
        if (arr.length === 0) throw new UserError('Could not find player')

        arr.map(entity => {
          entity.op = true
          return `Opped ${entity}`
        })
      } else {
        if (!player.op) {
          player.op = true

          player.chat(`§7§o[${player.username ?? 'Server'}: Opped ${player.username}]`)
          return `Opped ${player.username}`
        } else {
          return `${player.username} is opped already`
        }
      }
    }
  })

  serv.commands.add({
    base: 'deop',
    info: 'Deop a player',
    usage: '/deop <player>',
    op: true,
    parse (params) {
      if (!params.match(/([a-zA-Z0-9_]+)/)) return false
      return params
    },
    action (params) {
      params = params.split(' ')
      const player = serv.getPlayer(params[0])
      if (player === undefined || player === null) {
        const arr = serv.selectorString(params)
        if (arr.length === 0) throw new UserError('Could not find player')

        arr.map(entity => {
          entity.op = false
          return `Deopped ${entity}`
        })
      } else {
        if (player.op) {
          player.op = false

          player.chat(`§7§o[Server: Deopped ${params[0]}]`)
          return `Deopped ${params[0]}`
        } else {
          return `${params[0]} isn't opped`
        }
      }
    }
  })

  serv.commands.add({
    base: 'kick',
    info: 'to kick a player',
    usage: '/kick <player> [reason]',
    op: true,
    parse (str) {
      if (!str.match(/([a-zA-Z0-9_]+)(?: (.*))?/)) { return false }
      const parts = str.split(' ')
      return {
        username: parts.shift(),
        reason: parts.join(' ')
      }
    },
    action ({ username, reason }, ctx) {
      const kickPlayer = serv.getPlayer(username)
      if (!kickPlayer) {
        if (ctx.player) ctx.player.chat(username + ' is not on this server!')
        else throw new UserError(username + ' is not on this server!')
      } else {
        kickPlayer.kick(reason)
        kickPlayer.emit('kicked', ctx.player ? ctx.player : { username: '[@]' }, reason)
      }
    }
  })

  serv.commands.add({
    base: 'ban',
    info: 'to ban a player',
    usage: '/ban <player> [reason]',
    op: true,
    parse (str) {
      if (!str.match(/([a-zA-Z0-9_]+)(?: (.*))?/)) { return false }
      const parts = str.split(' ')
      return {
        username: parts.shift(),
        reason: parts.join(' ')
      }
    },
    action ({ username, reason }, ctx) {
      const banPlayer = serv.getPlayer(username)

      if (!banPlayer) {
        if (settings['online-mode']) {
          serv.banUUID(username, reason)
            .then(result => {
              if (result) {
                serv.emit('banned', ctx.player ? ctx.player : { username: '[@]' }, username, reason)
                if (ctx.player) ctx.player.chat(username + ' was banned')
                else serv.info(username + ' was banned')
              } else {
                if (ctx.player) ctx.player.chat(username + ' is banned!')
                else serv.err(username + ' is banned!')
              }
            })
            .catch(err => {
              if (err) { // This tricks eslint
                if (ctx.player) ctx.player.chat(username + ' is not a valid player!')
                else serv.err(username + ' is not a valid player!')
              }
            })
        } else {
          serv.banUsername(username, reason)
            .then(result => {
              if (result) {
                serv.emit('banned', ctx.player ? ctx.player : { username: '[@]' }, username, reason)
                if (ctx.player) ctx.player.chat(username + ' was banned')
                else serv.info(username + ' was banned')
              } else {
                if (ctx.player) ctx.player.chat(username + ' is banned!')
                else serv.err(username + ' is banned!')
              }
            })
            .catch(err => {
              if (err) { // This tricks eslint
                if (ctx.player) ctx.player.chat(username + ' is not a valid player!')
                else serv.err(username + ' is not a valid player!')
              }
            })
        }
      } else {
        if (settings['online-mode']) {
          banPlayer.banUUID(reason)
            .then(result => {
              if (result) {
                serv.emit('banned', ctx.player ? ctx.player : { username: '[@]' }, username, reason)
                if (ctx.player) ctx.player.chat(username + ' was banned')
                else serv.info(username + ' was banned')
              } else {
                if (ctx.player) ctx.player.chat(username + ' is banned!')
                else serv.err(username + ' is banned!')
              }
            })
        } else {
          banPlayer.banUsername(reason)
            .then(result => {
              if (result) {
                serv.emit('banned', ctx.player ? ctx.player : { username: '[@]' }, username, reason)
                if (ctx.player) ctx.player.chat(username + ' was banned')
                else serv.info(username + ' was banned')
              } else {
                if (ctx.player) ctx.player.chat(username + ' is banned!')
                else serv.err(username + ' is banned!')
              }
            })
        }
      }
    }
  })

  serv.commands.add({
    base: 'ban-ip',
    info: 'bans a specific IP',
    usage: '/ban-ip <ip> [reason]',
    op: true,
    parse (str) {
      const argv = str.split(' ')
      if (argv[0] === '') return false
      if (!/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(argv[0])) throw new UserError('IP is not correct')

      return {
        IP: argv.shift(),
        reason: argv.shift()
      }
    },
    action ({ IP, reason }, ctx) {
      serv.banIP(IP, reason)
        .then(result => {
          if (result) {
            if (ctx.player) ctx.player.chat(`IP ${IP} was banned ${reason ? '(' + reason + ')' : ''}`)
            else serv.info(`IP ${IP} was banned ${reason ? '(' + reason + ')' : ''}`)
          } else {
            if (ctx.player) ctx.player.chat(`IP ${IP} is banned!`)
            else serv.err(`IP ${IP} is banned!`)
          }
        })
    }
  })

  serv.commands.add({
    base: 'banlist',
    info: 'Displays banlist.',
    usage: '/banlist',
    op: true,
    action (v, ctx) {
      const pllist = Object.keys(serv.bannedPlayers)
      const iplist = Object.keys(serv.bannedIPs)
      if (v !== 'ips') {
        if (ctx.player) {
          ctx.player.chat(`There are ${pllist.length} total banned players${pllist.length > 0 ? ':' : ''}`)
          pllist.forEach(e => {
            ctx.player.chat(e)
          })
        } else {
          serv.info(`There are ${pllist.length} total banned players${pllist.length > 0 ? ':' : ''}`)
          pllist.forEach(e => {
            serv.info(e)
          })
        }
      } else {
        if (ctx.player) {
          ctx.player.chat(`There are ${iplist.length} total banned IP addresses${iplist.length > 0 ? ':' : ''}`)
          iplist.forEach(e => {
            ctx.player.chat(e)
          })
        } else {
          serv.info(`There are ${iplist.length} total banned IP addresses${iplist.length > 0 ? ':' : ''}`)
          iplist.forEach(e => {
            serv.info(e)
          })
        }
      }
    }
  })

  serv.commands.add({
    base: 'pardon-ip',
    info: 'to pardon a player by ip',
    usage: '/pardon-ip <ip>',
    op: true,
    action (IP, ctx) {
      serv.pardonIP(IP)
        .then(result => {
          if (result) {
            if (ctx.player) ctx.player.chat(`IP ${IP} was pardoned`)
            else serv.info(`IP ${IP} was pardoned`)
          } else {
            if (ctx.player) ctx.player.chat(`IP ${IP} is not banned`)
            else serv.err(`IP ${IP} is not banned`)
          }
        })
    }
  })

  serv.commands.add({
    base: 'pardon',
    info: 'to pardon a player',
    usage: '/pardon <player>',
    op: true,
    parse (str) {
      if (!str.match(/([a-zA-Z0-9_]+)/)) { return false }
      return str
    },
    action (nick, ctx) {
      if (settings['online-mode']) {
        serv.pardonUUID(nick)
          .then((result) => {
            if (result) {
              if (ctx.player) ctx.player.chat(nick + ' is unbanned')
              else serv.info(nick + ' is unbanned')
            } else {
              if (ctx.player) ctx.player.chat(nick + ' is not banned')
              else serv.err(nick + ' is not banned')
            }
          })
      } else {
        serv.pardonUsername(nick)
          .then((result) => {
            if (result) {
              if (ctx.player) ctx.player.chat(nick + ' is unbanned')
              else serv.info(nick + ' is unbanned')
            } else {
              if (ctx.player) ctx.player.chat(nick + ' is not banned')
              else serv.err(nick + ' is not banned')
            }
          })
      }
    }
  })
}

export const player = function (player: Player, serv: Server) {
  player.kick = (reason = 'You were kicked!') =>
    player._client.end(reason)

  player.banUUID = reason => {
    reason = reason || 'You were banned!'
    player.kick(reason)
    const uuid = player.uuid
    return serv.ban(uuid, reason)
  }
  player.banUsername = reason => {
    reason = reason || 'You were banned!'
    player.kick(reason)
    const nick = player.username
    return serv.banUsername(nick, reason)
  }
  player.banIP = reason => {
    reason = reason || 'You were IP banned!'
    player.kick(reason)
    return serv.banIP(player._client.socket?.remoteAddress)
  }

  // I think it doesn't do anything but ok well...
  player.pardonUUID = () => serv.pardonUsername(player.uuid)
  player.pardonUsername = () => serv.pardonUsername(player.username)
}
declare global {
  interface Server {
    "ban": (uuid: any, reason?: string) => Promise<boolean>
    "banIP": (IP: any, reason?: string) => Promise<boolean>
    "getUUIDFromUsername": (username: any) => Promise<unknown>
    "banUsername": (username: any, reason: any) => Promise<any>
    "banUUID": (username: any, reason: any) => Promise<any>
    "pardonUsername": (username: any) => Promise<boolean>
    "pardonUUID": (username: any) => Promise<any>
    "pardonIP": (IP: any) => Promise<boolean>
    "bannedPlayers": {}
    "bannedIPs": {}
  }
  interface Player {
    "kick": (reason?: string) => void
    "banUUID": (reason: any) => any
    "banUsername": (reason: any) => any
    "banIP": (reason: any) => any
    "pardonUUID": () => any
    "pardonUsername": () => any
  }
}
