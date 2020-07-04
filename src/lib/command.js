const UserError = require('./user_error')

class Command {
  constructor (params, parent, hash) {
    this.params = params
    this.parent = parent
    this.hash = parent ? parent.hash : {}
    this.uniqueHash = parent ? parent.uniqueHash : {}
    this.parentBase = (this.parent && this.parent.base && this.parent.base + ' ') || ''
    this.base = this.parentBase + (this.params.base || '')

    if (this.params.base) this.updateHistory()
  }

  find (command) {
    const parts = command.split(' ')
    const c = parts.shift()
    const pars = parts.join(' ')
    if (this.hash[c]) { return [this.hash[c], pars] }
    return undefined
  }

  async use (command, ctx = {}, op = true) {
    let res = this.find(command)

    if (res) {
      let [com, pars] = res
      if (com.params.onlyConsole && ctx.player) return 'This command is console only'
      if (com.params.onlyPlayer && !ctx.player) throw new UserError('This command is player only')
      if (com.params.op && !op) return 'You do not have permission to use this command'
      const parse = com.params.parse
      if (parse) {
        if (typeof parse === 'function') {
          pars = parse(pars, ctx)
          if (pars === false) {
            if (ctx.player) return com.params.usage ? 'Usage: ' + com.params.usage : 'Bad syntax'
            else throw new UserError(com.params.usage ? 'Usage: ' + com.params.usage : 'Bad syntax')
          }
        } else {
          pars = pars.match(parse)
        }
      }

      res = await com.params.action(pars, ctx)

      if (res) return '' + res
    } else {
      if (ctx.player) return 'Command not found'
      else throw new UserError('Command not found')
    }
  }

  updateHistory () {
    const all = '(.+?)'

    const list = [this.base]
    if (this.params.aliases && this.params.aliases.length) {
      this.params.aliases.forEach(al => list.unshift(this.parentBase + al))
    }

    list.forEach((command) => {
      const parentBase = this.parent ? (this.parent.path || '') : ''
      this.path = parentBase + this.space() + (command || all)
      if (this.path === all && !this.parent) this.path = ''

      if (this.path) this.hash[this.path] = this
    })
    this.uniqueHash[this.base] = this
  }

  add (params) {
    return new Command(params, this)
  }

  space (end) {
    const first = !(this.parent && this.parent.parent)
    return this.params.merged || (!end && first) ? '' : ' '
  }

  setOp (op) {
    this.params.op = op
  }

  tab (command, i) {
    if (this.find(command)[0].params.tab) return this.find(command)[0].params.tab[i]
    return 'player'
  }
}

module.exports = Command
