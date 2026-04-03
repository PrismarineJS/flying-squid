const fs = require('fs')
const path = require('path')
const Vec3 = require('vec3').Vec3

module.exports.player = function (player, serv) {
  player.tpaRequest = null
}

module.exports.server = function (serv) {
  const dbPath = path.join(__dirname, 'homes.json')

  const loadHomes = () => {
    if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, '{}')
    return require(dbPath)
  }

  const saveHomes = (data) => {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2))
  }

  serv.commands.add({
    base: 'tpa',
    info: 'Request teleport',
    usage: '/tpa <player>',
    action (params, ctx) {
      const player = ctx.player
      if (!player) return 'Player only'

      if (!params) return 'Usage: /tpa <player>'
      const target = serv.getPlayer(params)
      if (!target) return 'Player offline'
      if (target === player) return 'Cannot tpa to self'

      target.tpaRequest = player
      target.chat(`${player.username} wants to teleport to you. /tpaccept`)
      player.chat(`Request sent to ${target.username}`)
      
      setTimeout(() => {
        if (target.tpaRequest === player) {
          target.tpaRequest = null
          player.chat('TPA request timed out')
          target.chat(`TPA request from ${player.username} timed out`)
        }
      }, 60000)
    }
  })

  serv.commands.add({
    base: 'tpaccept',
    info: 'Accept teleport',
    usage: '/tpaccept',
    action (params, ctx) {
      const player = ctx.player
      if (!player) return 'Player only'

      if (!player.tpaRequest) return 'No pending requests'
      const requester = player.tpaRequest
      if (serv.players.indexOf(requester) === -1) return 'Player offline'

      requester.teleport(player.position)
      requester.chat(`Teleported to ${player.username}`)
      player.chat('Request accepted')
      player.tpaRequest = null
    }
  })

  serv.commands.add({
    base: 'tpdeny',
    info: 'Deny teleport',
    usage: '/tpdeny',
    action (params, ctx) {
      const player = ctx.player
      if (!player) return 'Player only'

      if (!player.tpaRequest) return 'No pending requests'
      const requester = player.tpaRequest
      requester.chat(`${player.username} denied your request`)
      player.chat('Request denied')
      player.tpaRequest = null
    }
  })

  serv.commands.add({
    base: 'sethome',
    info: 'Set home',
    usage: '/sethome [name]',
    action (params, ctx) {
      const player = ctx.player
      if (!player) return 'Player only'

      const name = params || 'default'
      const homes = loadHomes()
      if (!homes[player.username]) homes[player.username] = {}
      
      homes[player.username][name] = {
        x: player.position.x,
        y: player.position.y,
        z: player.position.z,
        yaw: player.yaw,
        pitch: player.pitch
      }
      
      saveHomes(homes)
      return `Home '${name}' set`
    }
  })

  serv.commands.add({
    base: 'home',
    info: 'Teleport home',
    usage: '/home [name]',
    action (params, ctx) {
      const player = ctx.player
      if (!player) return 'Player only'

      const name = params || 'default'
      const homes = loadHomes()
      
      if (!homes[player.username] || !homes[player.username][name]) {
        return `Home '${name}' not found`
      }

      const h = homes[player.username][name]
      const pos = new Vec3(h.x, h.y, h.z)
      
      player.chat('Teleporting in 3 seconds...')
      setTimeout(() => {
        player.teleport(pos)
        player.yaw = h.yaw
        player.pitch = h.pitch
        player.chat(`Teleported to ${name}`)
      }, 3000)
    }
  })

  serv.commands.add({
    base: 'delhome',
    info: 'Delete home',
    usage: '/delhome [name]',
    action (params, ctx) {
      const player = ctx.player
      if (!player) return 'Player only'

      const name = params || 'default'
      const homes = loadHomes()
      if (!homes[player.username] || !homes[player.username][name]) return 'Home not found'
      
      delete homes[player.username][name]
      saveHomes(homes)
      return `Home '${name}' deleted`
    }
  })
  
  serv.commands.add({
    base: 'homes',
    info: 'List homes',
    usage: '/homes',
    action (params, ctx) {
      const player = ctx.player
      if (!player) return 'Player only'

      const homes = loadHomes()
      if (!homes[player.username]) return 'No homes set'
      return 'Homes: ' + Object.keys(homes[player.username]).join(', ')
    }
  })
}
