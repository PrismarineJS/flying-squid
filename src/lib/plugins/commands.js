const UserError = require('flying-squid').UserError
const Command = require('flying-squid').Command

module.exports.player = function (player, serv, { version }) {
  player.commands.add({
    base: 'help',
    aliases: ['?'],
    info: 'to show all commands',
    usage: '/help [command]',
    parse (str) {
      const params = str.split(' ')
      const page = parseInt(params[params.length - 1])
      if (page) {
        params.pop()
      }
      const search = params.join(' ')
      return { search: search, page: (page && page - 1) || 0 }
    },
    action ({ search, page }) {
      if (page < 0) return 'Page # must be >= 1'
      const hash = player.commands.uniqueHash

      const PAGE_LENGTH = 7

      let found = Object.keys(hash).filter(h => (h + ' ').indexOf((search && search + ' ') || '') === 0)

      if (found.length === 0) { // None found
        return 'Could not find any matches'
      } else if (found.length === 1) { // Single command found, giev info on command
        const cmd = hash[found[0]]
        const usage = (cmd.params && cmd.params.usage) || cmd.base
        const info = (cmd.params && cmd.params.info) || 'No info'
        player.chat(usage + ': ' + info)
      } else { // Multiple commands found, give list with pages
        const totalPages = Math.ceil((found.length - 1) / PAGE_LENGTH)
        if (page >= totalPages) return 'There are only ' + totalPages + ' help pages'
        found = found.sort()
        if (found.indexOf('search') !== -1) {
          const baseCmd = hash[search]
          player.chat(baseCmd.base + ' -' + ((baseCmd.params && baseCmd.params.info && ' ' + baseCmd.params.info) || '=-=-=-=-=-=-=-=-'))
        } else {
          player.chat('Help -=-=-=-=-=-=-=-=-')
        }
        for (let i = PAGE_LENGTH * page; i < Math.min(PAGE_LENGTH * (page + 1), found.length); i++) {
          if (found[i] === search) continue
          const cmd = hash[found[i]]
          const usage = (cmd.params && cmd.params.usage) || cmd.base
          const info = (cmd.params && cmd.params.info) || 'No info'
          player.chat(usage + ': ' + info)
        }
        player.chat('--=[Page ' + (page + 1) + ' of ' + totalPages + ']=--')
      }
    }
  })

  player.commands.add({
    base: 'ping',
    info: 'to pong!',
    usage: '/ping [number]',
    action (params) {
      const num = params[0] * 1 + 1

      let str = 'pong'
      if (!isNaN(num)) str += ' [' + num + ']'

      player.chat(str + '!')
    }
  })

  player.commands.add({
    base: 'modpe',
    info: 'for modpe commands',
    usage: '/modpe <params>',
    parse (str) { return str || false },
    action (str) {
      player.emit('modpe', str)
    }
  })

  player.commands.add({
    base: 'version',
    info: 'to get version of the server',
    usage: '/version',
    action () {
      return 'This server is running flying-squid version ' + version
    }
  })

  player.commands.add({
    base: 'bug',
    info: 'to bug report',
    usage: '/bug',
    action () {
      return 'Report bugs / issues here: https://github.com/PrismarineJS/flying-squid/issues'
    }
  })

  player.commands.add({
    base: 'selector',
    info: 'Get array from selector',
    usage: '/selector <selector>',
    op: true,
    parse (str) {
      return str || false
    },
    action (sel) {
      const arr = serv.selectorString(sel, player.position, player.world)
      player.chat(JSON.stringify(arr.map(a => a.id)))
    }
  })

  player.handleCommand = async (str) => {
    try {
      const res = await player.commands.use(str, player.op)
      if (res) player.chat(serv.color.red + res)
    } catch (err) {
      if (err.userError) player.chat(serv.color.red + 'Error: ' + err.message)
      else setTimeout(() => { throw err }, 0)
    }
  }
}

module.exports.entity = function (entity, serv) {
  entity.selectorString = (str) => serv.selectorString(str, entity.position, entity.world)
}

module.exports.server = function (serv) {
  serv.commands = new Command({})

  serv.handleCommand = async (str) => {
    try {
      const res = await serv.commands.use(str)
      if (res) serv.log('[INFO]: ' + res)
    } catch (err) {
      if (err.userError) serv.log('[ERR]: ' + err.message)
      else setTimeout(() => { throw err }, 0)
    }
  }

  serv.commands.add({
    base: 'help',
    aliases: ['?'],
    info: 'to show all commands',
    usage: 'help [command]',
    parse (str) {
      const params = str.split(' ')
      const page = parseInt(params[params.length - 1])
      if (page) {
        params.pop()
      }
      const search = params.join(' ')
      return { search: search, page: (page && page - 1) || 0 }
    },
    action ({ search, page }) {
      if (page < 0) return 'Page # must be >= 1'
      const hash = serv.commands.uniqueHash

      const PAGE_LENGTH = 7

      let found = Object.keys(hash).filter(h => (h + ' ').indexOf((search && search + ' ') || '') === 0)

      if (found.length === 0) { // None found
        return 'Could not find any matches'
      } else if (found.length === 1) { // Single command found, giev info on command
        const cmd = hash[found[0]]
        const usage = (cmd.params && cmd.params.usage) || cmd.base
        const info = (cmd.params && cmd.params.info) || 'No info'
        console.log(usage + ': ' + info)
      } else { // Multiple commands found, give list with pages
        const totalPages = Math.ceil((found.length - 1) / PAGE_LENGTH)
        if (page >= totalPages) return 'There are only ' + totalPages + ' help pages'
        found = found.sort()
        if (found.indexOf('search') !== -1) {
          const baseCmd = hash[search]
          console.log(baseCmd.base + ' -' + ((baseCmd.params && baseCmd.params.info && ' ' + baseCmd.params.info) || '=-=-=-=-=-=-=-=-'))
        } else {
          console.log('--=[ Help ]=--')
        }
        for (let i = PAGE_LENGTH * page; i < Math.min(PAGE_LENGTH * (page + 1), found.length); i++) {
          if (found[i] === search) continue
          const cmd = hash[found[i]]
          const usage = (cmd.params && cmd.params.usage) || cmd.base
          const info = (cmd.params && cmd.params.info) || 'No info'
          console.log('\x1b[33m' + usage + '\x1b[0m: ' + info)
        }
        console.log('--=[ Page ' + (page + 1) + ' of ' + totalPages + ' ]=--')
      }
    }
  })

  serv.commands.add({
    base: 'gamemode',
    info: 'Change gamemode',
    usage: 'gamemode <0-3> <player>',
    parse (params) {
      return params || false
    },
    action (params) {
      var gamemodes = [0, 1, 2, 3]
      params = params.split(' ')
      if (!(params[0] in gamemodes)) {
        throw new UserError(`Gamemode ${params[0]} is not found`)
      }

      if (params[1] === undefined || params[1] === null || params[1] === '') {
        throw new UserError('Player is not defined')
      }

      var player = serv.getPlayer(params[1])
      if (player === undefined || player === null) {
        const arr = serv.selectorString(params)
        if (arr.length === 0) throw new UserError('Could not find player')

        arr.map(entity => {
          entity.setGameMode(params[0])
          return `Succesfully set ${entity}'s gamemode to ${params[0]}`
        })
      } else {
        player.setGameMode(params[0])
        return `Succesfully set ${params[1]}'s gamemode to ${params[0]}`
      }
    }
  })

  serv.commands.add({
    base: 'op',
    info: 'Op a player',
    usage: 'op <player>',
    parse (params) {
      return params || false
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
    usage: 'deop <player>',
    parse (params) {
      return params || false
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
    base: 'stop',
    info: 'Stop the server',
    usage: 'stop',
    action () {
      process.exit()
    }
  })

  serv.commands.add({
    base: 'say',
    info: 'Broadcast a message',
    usage: 'say <message>',
    parse (params) {
      return params || false
    },
    action (params) {
      serv.broadcast('[@] ' + params)

      return '[@] ' + params
    }
  })

  function shuffleArray (array) {
    let currentIndex = array.length
    let temporaryValue
    let randomIndex

    // While there remain elements to shuffle...
    while (currentIndex !== 0) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex)
      currentIndex -= 1

      // And swap it with the current element.
      temporaryValue = array[currentIndex]
      array[currentIndex] = array[randomIndex]
      array[randomIndex] = temporaryValue
    }

    return array
  }

  const notudf = i => typeof i !== 'undefined'

  serv.selector = (type, opt) => {
    if (['all', 'random', 'near', 'entity'].indexOf(type) === -1) { throw new UserError('serv.selector(): type must be either [all, random, near, or entity]') }

    const count = opt.count !== undefined
      ? opt.count
      : (type === 'all' || type === 'entity' ? serv.entities.length : 1)

    const pos = opt.pos
    let sample
    if (type === 'all') sample = serv.players
    else if (type === 'random' || type === 'near') sample = serv.players.filter(p => p.health !== 0)
    else if (type === 'entity') sample = Object.keys(serv.entities).map(k => serv.entities[k])

    const checkOption = (val, compare) => {
      if (!val) return true
      const not = val[0] === '!'
      let v = val
      if (not) v = v.slice(1, v.length)
      if (not && compare === v) return false
      if (!not && compare !== v) return false
      return true
    }

    const scores = {
      max: [],
      min: []
    }

    Object.keys(opt).forEach(o => {
      if (o.indexOf('score_') !== 0) return
      const score = o.replace('score_', '')
      if (score.indexOf('_min') === score.length - 1) {
        scores.min.push({
          score: score.replace('_min', ''),
          val: opt[o]
        })
      } else {
        scores.max.push({
          score: score,
          val: opt[o]
        })
      }
    })

    sample = sample.filter(s => {
      if ((notudf(opt.radius) && s.position.distanceTo(pos) > opt.radius) ||
          (notudf(opt.minRadius) && s.position.distanceTo(pos) < opt.minRadius) ||
          (notudf(opt.gameMode) && s.gameMode !== opt.gameMode) ||
          (notudf(opt.level) && s.level > opt.level) ||
          (notudf(opt.minLevel) && s.level < opt.minLevel) ||
          (notudf(opt.yaw) && s.yaw > opt.yaw) ||
          (notudf(opt.minYaw) && s.yaw < opt.minYaw) ||
          (notudf(opt.pitch) && s.pitch > opt.pitch) ||
          (notudf(opt.minPitch) && s.pitch < opt.minPitch)) { return false }

      if (!checkOption(opt.team, s.team)) return false
      if (!checkOption(opt.name, s.username)) return false
      if (!checkOption(opt.type, s.name)) return false

      let fail = false
      scores.max.forEach(m => {
        if (fail) return
        if (!notudf(s.scores[m.score])) fail = true
        else if (s.scores[m] > m.val) fail = true
      })
      if (fail) return false
      scores.min.forEach(m => {
        if (fail) return
        if (!notudf(s.scores[m.score])) fail = true
        else if (s.scores[m] < m.val) fail = true
      })
      return !fail
    })

    if (type === 'near') sample.sort((a, b) => a.position.distanceTo(opt.pos) > b.position.distanceTo(opt.pos))
    else if (type === 'random') sample = shuffleArray(sample)
    else sample = sample.reverse() // Front = newest

    if (count > 0) return sample.slice(0, count)
    else return sample.slice(count) // Negative, returns from end
  }

  serv.selectorString = (str, pos, world, allowUser = true) => {
    if (pos) pos = pos.clone()
    const player = serv.getPlayer(str)
    if (!player && str[0] !== '@') return []
    else if (player) return allowUser ? [player] : []
    const match = str.match(/^@([arpe])(?:\[([^\]]+)\])?$/)
    if (match === null) throw new UserError('Invalid selector format')
    const typeConversion = {
      a: 'all',
      r: 'random',
      p: 'near',
      e: 'entity'
    }
    const type = typeConversion[match[1]]
    const opt = match[2] ? match[2].split(',') : []
    const optPair = []
    let err
    opt.forEach(o => {
      const match = o.match(/^([^=]+)=([^=]+)$/)
      if (match === null) err = new UserError('Invalid selector option format: "' + o + '"')
      else optPair.push({ key: match[1], val: match[2] })
    })
    if (err) throw err

    const optConversion = {
      type: 'type',
      r: 'radius',
      rm: 'minRadius',
      m: 'gameMode',
      c: 'count',
      l: 'level',
      lm: 'minLevel',
      team: 'team',
      name: 'name',
      rx: 'yaw',
      rxm: 'minYaw',
      ry: 'pitch',
      rym: 'minPitch'
    }
    const convertInt = ['r', 'rm', 'm', 'c', 'l', 'lm', 'rx', 'rxm', 'ry', 'rym']

    const data = {
      pos: pos || '',
      world: world,
      scores: [],
      minScores: []
    }

    optPair.forEach(({ key, val }) => {
      if (['x', 'y', 'z'].indexOf(key) !== -1) pos[key] = val
      else if (!optConversion[key]) {
        data[key] = val
      } else {
        if (convertInt.indexOf(key) !== -1) val = parseInt(val)
        data[optConversion[key]] = val
      }
    })

    return serv.selector(type, data)
  }

  serv.posFromString = (str, pos) => {
    if (str.indexOf('~') === -1) return parseFloat(str)
    if (str.match(/~-?\d+/)) return parseFloat(str.slice(1)) + pos
    else if (str === '~') return pos
    else throw new UserError('Invalid position')
  }
}
