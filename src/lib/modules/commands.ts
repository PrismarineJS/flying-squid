import colors from 'colors'
import UserError from '../user_error'

export const player = function (player: Player, serv: Server, { version }: Options) {
  player.handleCommand = async (str) => {
    try {
      const res = await serv.commands.use(str, { player }, player.op)
      if (res) player.chat(serv.color.red + res)
    } catch (err) {
      if (err.userError) player.chat(serv.color.red + 'Error: ' + err.message)
      else setTimeout(() => { throw err }, 0)
    }
  }
}

export const entity = function (entity: Entity, serv: Server) {
  entity.selectorString = (str) => serv.selectorString(str, entity.position, entity.world)
}

export const server = function (serv: Server, { version }: Options) {
  serv.handleCommand = async (str) => {
    try {
      const res = await serv.commands.use(str)
      if (res) serv.info(res)
    } catch (err) {
      if (err.userError) serv.err(err.message)
      else setTimeout(() => { throw err }, 0)
    }
  }

  serv.commands.add({
    base: 'ping',
    info: 'to pong!',
    usage: '/ping [number]',
    action (params, ctx) {
      const num = params[0] * 1 + 1

      let str = 'pong'
      if (!isNaN(num)) str += ' [' + num + ']'

      if (ctx.player) ctx.player.chat(str + '!')
      else serv.info(str + '!')
    }
  })

  serv.commands.add({
    base: 'modpe',
    info: 'for modpe commands',
    usage: '/modpe <params>',
    onlyPlayer: true,
    parse (str) { return str || false },
    action (str, ctx) {
      ctx.player.emit('modpe', str)
    }
  })

  serv.commands.add({
    base: 'version',
    info: 'to get version of the server',
    usage: '/version',
    action () {
      return 'This server is running flying-squid version ' + version
    }
  })

  serv.commands.add({
    base: 'bug',
    info: 'to bug report',
    usage: '/bug',
    action () {
      return 'Report bugs or issues here: https://github.com/PrismarineJS/flying-squid/issues'
    }
  })

  serv.commands.add({
    base: 'selector',
    info: 'Get entities id from selector like @a',
    usage: '/selector <selector>',
    op: true,
    parse (str) {
      return str || false
    },
    action (sel, ctx) {
      const arr = ctx.player ? serv.selectorString(sel, ctx.player.position, ctx.player.world) : serv.selectorString(sel)
      if (ctx.player) ctx.player.chat(JSON.stringify(arr.map(a => a.id)))
      else serv.info(JSON.stringify(arr.map(a => a.id)))
    }
  })

  serv.commands.add({
    base: 'help',
    aliases: ['?'],
    info: 'to show all commands',
    usage: '/help [command]',
    tab: ['command'],
    parse (str) {
      const params = str.split(' ')
      const page = parseInt(params[params.length - 1])
      if (page) {
        params.pop()
      }
      const search = params.join(' ')
      return { search, page: (page && page - 1) || 0 }
    },
    action ({ search, page }, ctx) {
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
        if (ctx.player) ctx.player.chat(usage + ': ' + info)
        else serv.info(usage + ': ' + info)
      } else { // Multiple commands found, give list with pages
        const totalPages = Math.ceil((found.length - 1) / PAGE_LENGTH).toString()
        if (page >= totalPages) return 'There are only ' + totalPages + ' help pages'
        found = found.sort()
        if (found.indexOf('search') !== -1) {
          const baseCmd = hash[search]
          if (ctx.player) ctx.player.chat(baseCmd.base + ' -' + ((baseCmd.params && baseCmd.params.info && ' ' + baseCmd.params.info) || '=-=-=-=-=-=-=-=-'))
          else serv.info(baseCmd.base + ' -' + ((baseCmd.params && baseCmd.params.info && ' ' + baseCmd.params.info) || '=-=-=-=-=-=-=-=-'))
        } else {
          if (ctx.player) ctx.player.chat('&2--=[ &fHelp&2, page &f' + (page + 1) + ' &2of &f' + totalPages + ' &2]=--')
          else serv.info(colors.green('--=[ ') + colors.white('Help') + colors.green(', page ') + colors.white(page + 1) + colors.green(' of ') + colors.white(totalPages) + colors.green(' ]=--'))
        }
        for (let i = PAGE_LENGTH * page; i < Math.min(PAGE_LENGTH * (page + 1), found.length); i++) {
          if (found[i] === search) continue
          const cmd = hash[found[i]]
          const usage = (cmd.params && cmd.params.usage) || cmd.base
          const info = (cmd.params && cmd.params.info) || 'No info'
          if (ctx.player) ctx.player.chat(usage + ': ' + info + ' ' + (cmd.params.onlyPlayer ? ('| &aPlayer only') : (cmd.params.onlyConsole ? ('| &cConsole only') : '')))
          else serv.info(colors.yellow(usage) + ': ' + info + ' ' + (cmd.params.onlyPlayer ? (colors.bgRed(colors.black('Player only'))) : (cmd.params.onlyConsole ? colors.bgGreen(colors.black('Console only')) : '')))
        }
      }
    }
  })

  serv.commands.add({
    base: 'stop',
    info: 'Stop the server',
    usage: '/stop',
    op: true,
    action () {
      serv.quit('Server closed')
      process.exit()
    }
  })

  serv.commands.add({
    base: 'say',
    info: 'Broadcast a message',
    usage: '/say <message>',
    op: true,
    parse (params) {
      return params || false
    },
    action (params, ctx) {
      const who = ctx.player ? ctx.player.username : 'Server'
      serv.broadcast(`[${who}] ` + params)
      serv.info(`[CHAT]: [${who}] ` + params)
    }
  })

  serv.commands.add({
    base: 'me',
    info: 'Displays a message about yourself',
    usage: '/me <message>',
    op: false,
    parse (params) {
      return params || false
    },
    action (params, ctx) {
      const who = ctx.player ? ctx.player.username : 'Server'
      serv.broadcast(`* ${who} ` + params)
      serv.info(`* ${who} ` + params)
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

  serv.selector = (type, opt, selfEntityId) => {
    if (['all', 'random', 'self', 'near', 'entity'].indexOf(type) === -1) { throw new UserError('serv.selector(): type must be either [all, random, self, near, or entity]') }

    const count = opt.count !== undefined
      ? opt.count
      : (type === 'all' || type === 'entity' ? Object.keys(serv.entities).length : 1)

    const pos = opt.pos
    let sample
    if (type === 'all') sample = serv.players
    else if (type === 'self') sample = serv.players.filter(p => p.id === selfEntityId)
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

    const scores: any = {
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
          score,
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

  serv.selectorString = (str, pos, world, allowUser = true, ctxEntityId?) => {
    if (pos) pos = pos.clone()
    const player = serv.getPlayer(str)
    if (!player && str[0] !== '@') return []
    else if (player) return allowUser ? [player] : []
    const match = str.match(/^@([arspe])(?:\[([^\]]+)\])?$/)
    if (match[1] === 'r' && !pos) throw new UserError('Can\'t find nearest players')
    if (match === null) throw new UserError('Invalid selector format')
    const typeConversion = {
      a: 'all',
      r: 'random',
      s: 'self',
      p: 'near',
      e: 'entity'
    }
    const type = typeConversion[match[1]]
    const opt = match[2] ? match[2].split(',') : []
    const optPair = [] as any[]
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
      world,
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

    return serv.selector(type, data, ctxEntityId)
  }

  serv.posFromString = (str, pos) => {
    if (str.indexOf('~') === -1) return parseFloat(str)
    if (str.match(/~-?\d+/)) return parseFloat(str.slice(1)) + pos
    else if (str === '~') return pos
    else throw new UserError('Invalid position')
  }
}
declare global {
  interface Player {
    "handleCommand": (str: any) => Promise<void>
  }
  interface Entity {
    "selectorString": (str: any) => any
  }
  interface Server {
    "handleCommand": (str: any) => Promise<void>
    "selector": (type: any, opt: any, selfEntityId: any) => any
    "selectorString": (str: any, pos?: any, world?: any, allowUser?: boolean | undefined, ctxEntityId?: any) => any
    "posFromString": (str: any, pos: any) => any
  }
}
