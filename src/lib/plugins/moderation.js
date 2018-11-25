const moment = require('moment')
const rp = require('request-promise')
const UUID = require('uuid-1345')

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

  player.commands.add({
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
    action ({ username, reason }) {
      const kickPlayer = serv.getPlayer(username)
      if (!kickPlayer) {
        player.chat(username + ' is not on this server!')
      } else {
        kickPlayer.kick(reason)
        kickPlayer.emit('kicked', player, reason)
      }
    }
  })

  player.commands.add({
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
    action ({ username, reason }) {
      const banPlayer = serv.getPlayer(username)

      if (!banPlayer) {
        serv.banUsername(username, reason)
          .then(() => {
            serv.emit('banned', player, username, reason)
            player.chat(username + ' was banned')
          })
          .catch(err => {
            if (err) { // This tricks eslint
              player.chat(username + ' is not a valid player!')
            }
          })
      } else {
        banPlayer.ban(reason)
        serv.emit('banned', player, username, reason)
      }
    }
  })

  player.commands.add({
    base: 'ban-ip',
    info: 'bans a specific IP',
    usage: '/ban-ip <ip> [reason]',
    op: true,
    parse (str) {
      const argv = str.split(' ')
      if (argv.length < 1) return

      return {
        IP: argv.shift(),
        reason: argv.shift()
      }
    },
    action ({ IP, reason }) {
      serv.banIP(IP, reason)
      player.chat('' + IP + ' was IP banned')
    }
  })

  player.commands.add({
    base: 'pardon-ip',
    info: 'to pardon a player by ip',
    usage: '/pardon-ip <ip>',
    op: true,
    action (IP) {
      const result = serv.pardonIP(IP)
      player.chat(result ? IP + ' was IP pardoned' : IP + ' is not banned')
    }
  })

  player.commands.add({
    base: 'pardon',
    info: 'to pardon a player',
    usage: '/pardon <player>',
    op: true,
    parse (str) {
      if (!str.match(/([a-zA-Z0-9_]+)/)) { return false }
      return str
    },
    action (nick) {
      serv.pardonUsername(nick)
        .then(() => player.chat(nick + ' is unbanned'))
        .catch(err => {
          if (err) { // This tricks eslint
            player.chat(nick + ' is not banned')
          }
        })
    }
  })

  player.commands.add({
    base: 'op',
    info: 'op any player',
    usage: '/op <player>',
    op: true,
    parse (str) {
      if (!str.match(/([a-zA-Z0-9_]+)/)) return false
      return str
    },
    action (username) {
      const user = serv.getPlayer(username)
      if (!user) return 'That player is not on the server.'
      user.op = true
      player.chat(username + ' is opped')
    }
  })

  player.commands.add({
    base: 'deop',
    info: 'deop any player',
    usage: '/deop <player>',
    op: true,
    parse (str) {
      if (!str.match(/([a-zA-Z0-9_]+)/)) return false
      return str
    },
    action (username) {
      const user = serv.getPlayer(username)
      if (!user) return 'That player is not on the server.'
      user.op = false
      player.chat(username + ' is deopped')
    }
  })
}
