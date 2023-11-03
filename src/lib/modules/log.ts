import fs from 'fs'

const timeStarted = Math.floor(Date.now() / 1000).toString()
import path from 'path'
import moment from 'moment'
import colors from 'colors'

const isInNode = typeof process !== 'undefined' && !process.browser && process.platform !== 'browser'

const _servers: Server[] = []

/** @type {typeof import("readline") | undefined} */
let readline
/** @type {import("readline").Interface | undefined} */
let rl
if (isInNode) {
  import(/* webpackIgnore: true */ 'exit-hook').then((hook) => {
    hook.default(() => {
      for (const serv of _servers) {
        serv.log('Server shutting down...')
        serv.quit()
      }
    })
  })
  readline = require('readline')
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  rl.setPrompt('> ')
  rl.prompt(true)
}

export const server = function (serv: Server, settings: Options) {
  _servers.push(serv)

  serv.on('error', error => serv.err('Server: ' + error.stack))
  serv.on('clientError', (client, error) => serv.err('Client ' + client.socket?.remoteAddress + ':' + client.socket.remotePort + ' : ' + error.stack))
  serv.on('listening', port => serv.info('Server listening on port ' + port))
  serv.on('banned', (banner, bannedUsername, reason) =>
    serv.info(banner.username + ' banned ' + bannedUsername + (reason ? ' (' + reason + ')' : '')))
  serv.on('seed', (seed) => serv.info('World seed: ' + seed))

  const logFile = path.join('logs', timeStarted + '.log')

  serv.log = message => {
    readline?.cursorTo(process.stdout, 0)
    message = moment().format('MMMM Do YYYY, HH:mm:ss') + ' ' + message
    message = serv.formatMessage?.(message) ?? message
    if (!message) return
    if (!settings.noConsoleOutput) console.log(message)
    if (!settings.logging) return
    fs.appendFile(logFile, message + '\n', (err) => {
      if (err) console.log(err)
    })
  }

  serv.info = message => {
    serv.log('[' + colors.green('INFO') + ']: ' + message)
  }

  serv.err = message => {
    serv.log('[' + colors.red('ERROR') + ']: ' + message)
  }

  serv.warn = message => {
    serv.log('[' + colors.yellow('WARN') + ']: ' + message)
  }

  if (isInNode) {
    console.log = (function () {
      const orig = console.log
      return function () {
        readline.cursorTo(process.stdout, 0)
        let tmp
        try {
          tmp = process.stdout
          // @ts-ignore
          process.stdout = process.stderr
          orig.apply(console, arguments)
        } finally {
          process.stdout = tmp
        }
        rl.prompt(true)
      }
    })()
  }

  serv.createLog = () => {
    if (!settings.logging) return
    fs.mkdir('logs', {
      recursive: true
    }, (err) => {
      if (err) {
        console.log(err)
        return
      }

      fs.writeFile(logFile, '[INFO]: Started logging...\n',
        (err) => {
          if (err) console.log(err)
        })
    })
  }

  rl?.on('line', (data) => {
    serv.handleCommand(data)
    rl.prompt(true)
  })
}

export const player = function (player: Player, serv: Server) {
  player.on('connected', () => serv.info(player.username + ' (' + player._client.socket?.remoteAddress + ') connected'))
  player.on('spawned', () => serv.info('Position written, spawning player...'))
  player.on('disconnected', (reason) => serv.info(player.username + ' disconnected. Reason: ' + reason))
  player.on('chat', ({ message }) => serv.info('<' + player.username + '>' + ' ' + message))
  player.on('kicked', (kicker, reason) => serv.info(kicker.username + ' kicked ' + player.username + (reason ? ' (' + reason + ')' : '')))
}
declare global {
  interface Server {
    formatMessage (message: any): any
    "log": (message: any) => void
    "info": (message: any) => void
    "err": (message: any) => void
    "warn": (message: any) => void
    "createLog": () => void
  }
}
