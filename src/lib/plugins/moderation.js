const moment = require('moment')
const rp = require('request-promise')
const UUID = require('uuid-1345')
const UserError = require('flying-squid').UserError

module.exports.server = function (serv) {
  serv.ban = (uuid, reason) => {
    serv.bannedPlayers[uuid] = {
      time: +moment(),
      reason: reason || 'Your account is banned!'
    }
  }
  serv.banIP = (IP, reason) => {
    serv.bannedIPs[IP] = {
      time: +moment(),
      reason: reason || 'Your IP is banned!'
    }
    Object.keys(serv.players)
      .filter(uuid => serv.players[uuid]._client.socket.remoteAddress === IP)
      .forEach(uuid => serv.players[uuid].kick(serv.bannedIPs[serv.players[uuid]._client.socket.remoteAddress].reason))
  }

  function uuidInParts (plainUUID) {
    return UUID.stringify(UUID.parse(plainUUID))
  }

  serv.getUUIDFromUsername = username => {
    return rp('https://api.mojang.com/users/profiles/minecraft/' + username)
      .then((body) => {
        if (!body) throw new Error('username not found')
        return uuidInParts(JSON.parse(body).id)
      })
      .catch(err => { throw err })
  }

  serv.banUsername = (username, reason) => {
    return serv.getUUIDFromUsername(username)
      .then(uuid => serv.ban(uuid, reason))
  }

  serv.pardonUsername = (username) => {
    return serv.getUUIDFromUsername(username)
      .then(pardon)
  }

  serv.pardonIP = (IP) => {
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
      params = params.split(' ')
      var player = serv.getPlayer(params[0])
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

          player.chat(`§7§o[Server: Opped ${params[0]}]`)
          return `Opped ${params[0]}`
        } else {
          return `${params[0]} is opped already`
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
      var player = serv.getPlayer(params[0])
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
        if(ctx.player) ctx.player.chat(username + ' is not on this server!')
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
        serv.banUsername(username, reason)
          .then(() => {
            serv.emit('banned', ctx.player ? ctx.player : { username: '[@]' }, username, reason)
            if(ctx.player) ctx.player.chat(username + ' was banned')
            else serv.info(username + ' was banned')
          })
          .catch(err => {
            if (err) { // This tricks eslint
              if(ctx.player) ctx.player.chat(username + ' is not a valid player!')
              else serv.err(username + ' is not a valid player!')
            }
          })
      } else {
        banPlayer.ban(reason)
        serv.emit('banned', ctx.player ? ctx.player : { username: '[@]' }, username, reason)
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
      if (ctx.player) ctx.player.chat(`${IP} was IP banned ${reason ? '('+reason+')' : ''}`)
      else serv.info(`${IP} was IP banned ${reason ? '('+reason+')' : ''}`)
    }
  })

  serv.commands.add({
    base: 'pardon-ip',
    info: 'to pardon a player by ip',
    usage: '/pardon-ip <ip>',
    op: true,
    action (IP, ctx) {
      const result = serv.pardonIP(IP)
      if(ctx.player) ctx.player.chat(result ? IP + ' was IP pardoned' : IP + ' is not banned')
      else serv.log(result ? IP + ' was IP pardoned' : IP + ' is not banned')
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
      serv.pardonUsername(nick)
        .then(() => {
          if (ctx.player) ctx.player.chat(nick + ' is unbanned')
          else serv.info(nick + ' is unbanned')
        })
        .catch(err => {
          if (err) { // This tricks eslint
            if (ctx.player) ctx.player.chat(nick + ' is not banned')
            else serv.info(nick + ' is not unbanned')
          }
        })
    }
  })
}

module.exports.player = function (player, serv) {
  player.kick = (reason = 'You were kicked!') =>
    player._client.end(reason)

  player.ban = reason => {
    reason = reason || 'You were banned!'
    player.kick(reason)
    const uuid = player.uuid
    serv.ban(uuid, reason)
  }
  player.banIP = reason => {
    reason = reason || 'You were IP banned!'
    player.kick(reason)
    serv.banIP(player._client.socket.remoteAddress)
  }

  player.pardon = () => serv.pardon(player.uuid)
}
