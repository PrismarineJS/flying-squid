import UserError from './user_error'

type Ctx<P extends boolean> = P extends true ? {
  player: Player
} : {
  player?: Player
}

type NonFalsey<T> = T extends false ? never : NonNullable<T>

type AddParams<T, P extends boolean = false> = {
  base: string,
  aliases?: string[],
  info: string,
  usage: string,
  onlyPlayer?: P
  op?: boolean
  parse?: (string: string, ctx: Ctx<P>) => T
  action: (data: NonFalsey<T>, ctx: Ctx<P>) => any
  tab?: string[]
}

class Command {
  hash: any
  uniqueHash: any
  parentBase: any
  base: any
  path: string

  constructor (public params, public parent?, hash?) {
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

  async use (command, ctx: Ctx<false> = {}, op = true) {
    const resultsFound = this.find(command)
    let parsedResponse
    if (resultsFound) {
      const wantedCommand = resultsFound[0]
      const passedArgs = resultsFound[1]
      if (wantedCommand.params.onlyConsole && ctx.player) return 'This command is console only'
      if (wantedCommand.params.onlyPlayer && !ctx.player) throw new UserError('This command is player only')
      if (wantedCommand.params.op && !op) return 'You do not have permission to use this command'
      const customArgsParser = wantedCommand.params.parse
      if (customArgsParser) {
        if (typeof customArgsParser === 'function') {
          parsedResponse = customArgsParser(passedArgs, ctx)
          if (parsedResponse === false) {
            if (ctx.player) return wantedCommand.params.usage ? 'Usage: ' + wantedCommand.params.usage : 'Bad syntax'
            else throw new UserError(wantedCommand.params.usage ? 'Usage: ' + wantedCommand.params.usage : 'Bad syntax')
          }
        } else {
          parsedResponse = passedArgs.match(customArgsParser)
        }
      }
      let output
      if (parsedResponse) output = await wantedCommand.params.action(parsedResponse, ctx)
      else output = await wantedCommand.params.action(resultsFound[1], ctx) // just give back the passed arg
      if (output) return '' + output
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

  add <T, P extends boolean>(params: AddParams<T, P>) {
    return new Command(params, this)
  }

  space (end = false) {
    const first = !(this.parent && this.parent.parent)
    return this.params.merged || (!end && first) ? '' : ' '
  }

  setOp (op) {
    this.params.op = op
  }

  tab (command, i) {
    //@ts-ignore
    if (this.find(command)[0].params.tab) return this.find(command)[0].params.tab[i]
    return 'player'
  }
}

export default Command
