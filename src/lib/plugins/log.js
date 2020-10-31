const fs = require('fs')
const timeStarted = Math.floor(new Date() / 1000).toString()
const path = require('path')
const mkdirp = require('mkdirp')
const moment = require('moment')
const colors = require('colors')

const readline = require('readline')
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

rl.setPrompt('> ')
rl.prompt(true)

module.exports.server = function (serv, settings) {
  serv.on('error', error => serv.err('Server: ' + error.stack))
  serv.on('clientError', (client, error) => serv.err('Client ' + client.socket.remoteAddress + ':' + client.socket.remotePort + ' : ' + error.stack))

  serv.on('listening', port => serv.info('Server listening on port ' + port))

  serv.on('banned', (banner, bannedUsername, reason) =>
    serv.info(banner.username + ' banned ' + bannedUsername + (reason ? ' (' + reason + ')' : '')))

  serv.on('seed', (seed) => serv.log('seed: ' + seed))

  const logFile = path.join('logs', timeStarted + '.log')

  serv.log = message => {
    readline.cursorTo(process.stdout, 0)
    message = moment().format('MMMM Do YYYY, HH:mm:ss') + ' ' + message
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
    serv.log('[' + colors.red('ERR') + ']: ' + message)
  }

  console.log = (function () {
    const orig = console.log
    return function () {
      readline.cursorTo(process.stdout, 0)
      let tmp
      try {
        tmp = process.stdout
        process.stdout = process.stderr
        orig.apply(console, arguments)
      } finally {
        process.stdout = tmp
      }
      rl.prompt(true)
    }
  })()

  serv.createLog = () => {
    if (!settings.logging) return
    mkdirp('logs', (err) => {
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

  rl.on('line', (data) => {
    serv.handleCommand(data)
    rl.prompt(true)
  })
}

module.exports.player = function (player, serv) {
  player.on('connected', () => serv.log('[' + colors.green('INFO') + ']: ' + player.username + ' (' + player._client.socket.remoteAddress + ') connected'))

  player.on('spawned', () => serv.log('[' + colors.green('INFO') + ']: position written, player spawning...'))

  player.on('disconnected', () => serv.log('[' + colors.green('INFO') + ']: ' + player.username + ' disconnected'))

  player.on('chat', ({ message }) => serv.log('[' + colors.green('INFO') + '] ' + '<' + player.username + '>' + ' ' + message))

  player.on('kicked', (kicker, reason) =>
    serv.log(kicker.username + ' kicked ' + player.username + (reason ? ' (' + reason + ')' : '')))
}
