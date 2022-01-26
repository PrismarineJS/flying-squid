module.exports.player = async function (player, serv) {
  function unhandledRejection (promise) {
    serv.warn('-------------------------------')
    serv.warn('Please report this flying-squid! This is bug (mabye)')
    serv.warn('Unhandled rejection warning!')
    serv.warn('Error: ' + promise)
    serv.warn('Report this error here: https://github.com/PrismarineJS/flying-squid/issues');
    serv.warn('-------------------------------')
    player.chat("§cAn error happend in flying-squid's code. Please report it to flying-squid")
    player.chat('§cError: ' + promise)
    player.chat('§cReport this error here: https://github.com/PrismarineJS/flying-squid/issues')
    serv.emit('unhandledRejectionWarning')
  }

  function uncaughtException (err) {
    serv.err('-------------------------------')
    serv.err('Please report this flying-squid! This is bug (mabye)')
    serv.err('Something went wrong!')
    serv.err('Error (short error message): ' + err)
    serv.err('Error (full error message): ' + err.stack)
    serv.err('Report this error here: https://github.com/PrismarineJS/flying-squid/issues')
    serv.err('-------------------------------')
    player.chat("§cAn error happend in flying-squid's code. Please report it to flying-squid")
    player.chat('§cError: ' + err)
    player.chat('§cReport this error here: https://github.com/PrismarineJS/flying-squid/issues')
    serv.emit('crash')
  }

  process.on('unhandledRejection', (promise) => { unhandledRejection(promise) })
  process.on('uncaughtException', err => { uncaughtException(err) })
}