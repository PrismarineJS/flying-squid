const moment = require('moment')
const needle = require('needle')
const uuid1345 = require('uuid-1345')
const crypto = require('crypto')
const { supportedVersions } = require('../version')
const UserError = require('flying-squid').UserError

const ipRegex = /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/
const uuidRegex = /^(\S{8})-?(\S{4})-?(\S{4})-?(\S{4})-?(\S{12})$/
const nameRegex = /^\w{3,16}$/
const selectorRegex = /^@([arpe])(?:\[([^\]]+)\])?$/

let pc = require('prismarine-chat')

module.exports.server = function (serv, settings) {
  const ChatMessage = pc(settings.version)

  let moderationMessages = {
    banned: {
      translate: 'multiplayer.disconnect.banned'
    },
    ip_banned: {
      translate: 'multiplayer.disconnect.ip_banned'
    },
    kicked: {
      translate: 'multiplayer.disconnect.kicked'
    }
  }
  
  serv.ban = async (uuid, reason, who) => {
    if (!serv.bannedPlayers[uuid]) {
      serv.bannedPlayers[uuid] = {
        time: +moment(),
        reason: reason || moderationMessages.banned,
        who: who || 'Server'
      }
      return true
    } else return false
  }
  serv.banIP = async (IP, reason, who) => {
    if (!serv.bannedIPs[IP]) {
      serv.bannedIPs[IP] = {
        time: +moment(),
        reason: reason || moderationMessages.ip_banned,
        who: who || 'Server'
      }
      Object.keys(serv.players)
        .filter(uuid => serv.players[uuid]._client.socket.remoteAddress === IP)
        .forEach(uuid => serv.players[uuid].kick(serv.bannedIPs[serv.players[uuid]._client.socket.remoteAddress].reason))
      return true
    } else return false
  }

  function uuidInParts (plainUUID) {
    const partArray = plainUUID.split(uuidRegex).filter(Boolean)
    return partArray.join('-')
  }

  function nameFromBytesUUID(input) {
    let md5Bytes = crypto.createHash('md5').update(input).digest()
    md5Bytes[6]  &= 0x0f;  /* clear version        */
    md5Bytes[6]  |= 0x30;  /* set to version 3     */
    md5Bytes[8]  &= 0x3f;  /* clear variant        */
    md5Bytes[8]  |= 0x80;  /* set to IETF variant  */
    return uuid1345.stringify(md5Bytes)
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

  serv.getUsernameFromUUID = async uuid => {
    return await new Promise((resolve, reject) => {
      needle('get', 'https://mcapi.ca/player/profile/' + uuidInParts(uuid), { json: true })
        .then((response) => {
          if (!response.body) throw new Error('UUID not found')
          var username = response.body.name
          if (typeof username !== 'string') throw new Error('UUID not found')
          resolve(username)
        })
        .catch(err => { throw err })
    })
  }

  serv.banUsername = async (username, reason, who) => {
    return serv.ban(username, reason, who)
  }

  serv.banUUID = async (username, reason, who) => {
    return serv.getUUIDFromUsername(username).then(uuid => serv.ban(uuid, reason, who))
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
      // if (!nameRegex.test(params) || !selectorRegex.test(params)) return false
      return params
    },
    action (username, ctx) {
      const selectorArray = serv.selectorString(username, 
        ctx.player ? ctx.player.position : undefined, 
        ctx.player ? ctx.player.world : serv.overworld, 
        true)

      let messages
      if (supportedVersions.indexOf(settings.version) < 5) {
        messages = {
          success: {
            translate: 'commands.op.success',
            with: [username]
          },
          failed: {
            translate: 'commands.op.failed',
            with: [username]
          },
          notFound: {
            translate: 'commands.generic.player.notFound',
            with: [username]
          }
        }
      } else {
        messages = {
          success: {
            translate: 'commands.op.success',
            with: [username]
          },
          failed: {
            translate: 'commands.op.failed'
          },
          notFound: {
            translate: 'argument.entity.notfound.player',
            with: [username]
          }
        }
      }

      if (selectorArray.length < 0) {
        if (ctx.player) return ctx.player.chat(messages.notFound)
        return serv.err(new ChatMessage(messages.notFound))
      }

      selectorArray.forEach(entity => {
        let successMessage = {
          translate: 'commands.op.success',
          with: [{ text: entity.username }]
        }

        let systemMessage = {
          translate: 'chat.type.admin',
          with: [{ 
            text: ctx.player ? ctx.player.username : 'Server' 
          }, successMessage],
          color: 'gray',
          italic: 'true'
        }

        entity.op = true
        serv.broadcast(systemMessage, { system: true })
      })
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
      const selectorArray = serv.selectorString(username, 
        ctx.player ? ctx.player.position : undefined, 
        ctx.player ? ctx.player.world : serv.overworld, 
        true)

      let messages
      if (supportedVersions.indexOf(settings.version) < 5) {
        messages = {
          success: {
            translate: 'commands.deop.success',
            with: [username]
          },
          failed: {
            translate: 'commands.deop.failed',
            with: [username]
          },
          notFound: {
            translate: 'commands.generic.player.notFound',
            with: [username]
          }
        }
      } else {
        messages = {
          success: {
            translate: 'commands.deop.success',
            with: [username]
          },
          failed: {
            translate: 'commands.deop.failed'
          },
          notFound: {
            translate: 'argument.entity.notfound.player',
            with: [username]
          }
        }
      }

      if (selectorArray.length < 0) throw new UserError(messages.notFound)

      selectorArray.forEach(entity => {
        let successMessage = {
          translate: 'commands.deop.success',
          with: [entity.username || entity.name]
        }

        let systemMessage = {
          translate: 'chat.type.admin',
          with: [{ 
            text: ctx.player ? ctx.player.username : 'Server' 
          }, successMessage],
          color: 'gray',
          italic: 'true'
        }

        entity.op = true
        serv.broadcast(systemMessage, { system: true })
      })
    }
  })

  serv.commands.add({
    base: 'kick',
    info: 'to kick a player',
    usage: '/kick <player> [reason]',
    op: true,
    parse (str) {
      const parts = str.split(' ')
      let obj = {
        username: parts.shift(),
        reason: parts.join(' ') || moderationMessages.kicked
      }

      if (!nameRegex.test(obj.username)) return false
      return obj
    },
    action ({ username, reason }, ctx) {
      const kickPlayer = serv.getPlayer(username)

      let messages
      if (supportedVersions.indexOf(settings.version) < 5) {
        messages = {
          success: {
            translate: 'commands.kick.success',
            with: [username]
          },
          successReason: {
            translate: 'commands.kick.success.reason',
            with: [username, typeof reason === 'string' ? { text: reason } : reason]
          },
          notFound: {
            translate: 'commands.generic.player.notFound',
            with: [username],
            color: 'red'
          }
        }
      } else {
        messages = {
          success: {
            translate: 'commands.kick.success',
            with: [username, typeof reason === 'string' ? { text: reason } : reason]
          },
          notFound: {
            translate: 'argument.entity.notfound.player',
            with: [username],
            color: 'red'
          }
        }
      }


      if (!kickPlayer) throw new UserError(messages.notFound)

      kickPlayer.kick(reason)

      let successMessage = supportedVersions.indexOf(settings.version) < 5 ? reason ? messages.successReason : messages.success : messages.success

      return successMessage
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
        reason: parts.join(' ') || moderationMessages.banned
      }
    },
    action ({ username, reason }, ctx) {
      const banPlayer = serv.getPlayer(username)

      let messages
      if (supportedVersions.indexOf(settings.version) < 5) {
        messages = {
          success: {
            translate: 'commands.ban.success',
            with: [{ text: username }]
          },
          failed: {
            translate: 'commands.ban.failed',
            with: [{ text: username }],
            color: 'red'
          }
        }
      } else {
        messages = {
          success: {
            translate: 'commands.ban.success',
            with: [{ text: username }, typeof reason === 'string' ? { text: reason } : reason]
          },
          failed: {
            translate: 'commands.ban.failed',
            color: 'red'
          }
        }
      }

      function resulter(result) {
        if (result) return messages.success
        return messages.failed
      }

      if (!banPlayer) {
        if (settings['online-mode']) return serv.banUUID(username, reason, ctx.player ? ctx.player.username : undefined).then(resulter)
        else return serv.banUsername(username, reason, ctx.player ? ctx.player.username : undefined).then(resulter)
      }

      return banPlayer.ban(reason, ctx.player ? ctx.player.username : undefined).then(resulter)
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

      return {
        IP: argv.shift(),
        reason: argv.shift() || 'Banned by an operator.'
      }
    },
    action ({ IP, reason }, ctx) {
      let messages, resulter
      if (supportedVersions.indexOf(settings.version) < 5) {
        messages = {
          success: {
            translate: 'commands.banip.success',
            with: [{ text: IP }]
          },
          successPlayers: {
            translate: 'commands.banip.success.players',
            with: [{ text: IP }, { text: String(Object.keys(serv.players).filter(uuid => serv.players[uuid]._client.socket.remoteAddress === IP)) }]
          },
          invalid: {
            translate: 'commands.banip.invalid',
            color: 'red'
          }
        }

        if(!ipRegex.test(IP)) {
          if (ctx.player) return ctx.player.chat(messages.invalid)

          return serv.err(new ChatMessage(messages.invalid))
        }

        resulter = () => {
          const bannedIPPlayers = Object.keys(serv.players).filter(uuid => serv.players[uuid]._client.socket.remoteAddress === IP)

          return bannedIPPlayers > 0 ? messages.successPlayers : messages.success
        }
      } else {
        messages = {
          failed: {
            translate: 'commands.banip.failed',
          },
          info: {
            // TODO
            translate: 'commands.banip.info'
          },
          invalid: {
            translate: 'commands.banip.invalid',
          },
          success: {
            translate: 'commands.banip.success',
            with: [{ text: IP }, { text: reason }]
          }
        }

        resulter = (result) => {
          if (result) return messages.success
          return messages.failed
        }
      }

      if(!ipRegex.test(IP)) return messages.invalid

      serv.banIP(IP, reason, ctx.player ? ctx.player.username : undefined).then(resulter)
    }
  })

  serv.commands.add({
    base: 'banlist',
    info: 'Displays banlist.',
    usage: '/banlist [ips|players]',
    op: true,
    parse (str) {
      if (/^ips$/.test(str)) return 1
      return 0
    },
    action (type, ctx) {
      var bannedList = type === 0 ? Object.keys(serv.bannedPlayers) : Object.keys(serv.bannedIPs)

      let messages

      if (supportedVersions.indexOf(settings.version) < 5) {
        messages = {
          ips: {
            translate: 'commands.banlist.ips',
            with: [ String(bannedList.length) ]
          },
          players: {
            translate: 'commands.banlist.players',
            with: [ String(bannedList.length) ]
          }
        }

        if (ctx.player) 
          ctx.player.chat(type === 0 ? messages.players : messages.ips)
        else 
          serv.info(new ChatMessage(type === 0 ? messages.players : messages.ips))

        bannedList.forEach(async banned => {
          if (ctx.player) 
            ctx.player.chat(type === 0 && settings['online-mode'] ? await serv.getUsernameFromUUID(banned) : banned)
          else 
            serv.info(new ChatMessage(type === 0 && settings['online-mode'] ? await serv.getUsernameFromUUID(banned) : banned))
        })
      } else {
        messages = {
          list: {
            translate: 'commands.banlist.list',
            with: [{ text: String(bannedList.length) }]
          },
          none: {
            translate: 'commands.banlist.none'
          }
        }

        if (bannedList.length > 0) {
          if (ctx.player) 
            ctx.player.chat(messages.list)
          else 
            serv.info(new ChatMessage(messages.list))

          bannedList.forEach(async banned => {
            let bannedEntry = {
              translate: 'commands.banlist.entry',
              with: [{ 
                text: type === 0 ? await serv.getUsernameFromUUID(banned) : banned
              }, { 
                text: (type === 0 ? serv.bannedPlayers[banned] : serv.bannedIPs[banned]).who
              }, { 
                text: (type === 0 ? serv.bannedPlayers[banned] : serv.bannedIPs[banned]).reason 
              }]
            }

            if (ctx.player) 
              ctx.player.chat(bannedEntry)
            else 
              serv.info(new ChatMessage(bannedEntry))
          })
        } else {
          if (ctx.player) 
            ctx.player.chat(messages.none)
          else 
            serv.info(new ChatMessage(messages.none))
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
      let messages, resulter
      if (supportedVersions.indexOf(settings.version) < 5) {
        messages = {
          success: {
            translate: 'commands.unbanip.success',
            with: [{ text: IP }]
          },
          invalid: {
            translate: 'commands.unbanip.invalid',
            color: 'red'
          }
        }

        resulter = () => {
          if (ctx.player) return ctx.player.chat(messages.success)
          return serv.info(new ChatMessage(messages.success))
        }
      } else {
        messages = {
          success: {
            translate: 'commands.pardonip.success',
            with: [{ text: IP }]
          },
          failed: {
            translate: 'commands.pardonip.failed',
            color: 'red'
          },
          invalid: {
            translate: 'commands.pardonip.invalid',
            color: 'red'
          }
        }

        resulter = (result) => {
          if (ctx.player) {
            if (result) return ctx.player.chat(messages.success)
            return ctx.player.chat(messages.failed)
          }
  
          if (result) return serv.info(new ChatMessage(messages.success))
          return serv.err(new ChatMessage(messages.failed))
        }
      }

      if (!ipRegex.test(IP)) {
        if (ctx.player) return ctx.player.chat(messages.invalid)
        return serv.err(new ChatMessage(messages.invalid))
      }

      serv.pardonIP(IP).then(resulter)
    }
  })

  serv.commands.add({
    base: 'pardon',
    info: 'to pardon a player',
    usage: '/pardon <player>',
    op: true,
    parse (str) {
      if (!/^\w{3,16}$/i.test(str)) return false
      return str
    },
    action (nick, ctx) {
      let messages
      if (supportedVersions.indexOf(settings.version) < 5) {
        messages = {
          success: {
            translate: 'commands.unban.success',
            with: [{ text: nick }]
          },
          failed: { 
            translate: 'commands.unban.failed',
            with: [{ text: nick }],
            color: 'red'
          }
        }
      } else {
        messages = {
          success: {
            translate: 'commands.pardon.success',
            with: [{ text: nick }]
          },
          failed: { 
            translate: 'commands.pardon.failed',
            color: 'red' 
          }
        }
      }

      let pardonPromise

      if (settings['online-mode']) 
        pardonPromise = serv.pardonUUID(nick)
      else 
        pardonPromise = serv.pardonUsername(nick)

      pardonPromise.then(result => {
        if (ctx.player) {
          if (result) return ctx.player.chat(messages.success)
          return ctx.player.chat(messages.failed)
        }

        if (result) return serv.info(new ChatMessage(messages.success))
        return serv.err(new ChatMessage(messages.failed))
      })
    }
  })
}

module.exports.player = function (player, serv) {
  player.kick = (reason) => {
    var fullReason
    if (typeof reason === 'string') fullReason = { text: reason }
    else fullReason = reason || moderationMessages.kicked
    player._client.end(reason, JSON.stringify(fullReason))
  }

  player.ban = (reason, who) => {
    reason = reason || moderationMessages.banned
    player.kick(reason)
    const nick = player.username
    const uuid = player.uuid
    if (settins['online-mode']) return serv.ban(uuid, reason, who)
    return serv.banUsername(nick, reason, who)
  }
  player.banIP = (reason, who) => {
    reason = reason || moderationMessages.ip_banned
    player.kick(reason)
    return serv.banIP(player._client.socket.remoteAddress, who)
  }

  // I think it doesn't do anything but ok well...
  player.pardon = () => settins['online-mode'] ? serv.pardonUUID(player.uuid) : serv.pardonUsername(player.username)
}
