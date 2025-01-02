module.exports.player = async function (player, serv) {
  if (globalThis.isMocha || serv.debug) return // Don't eat errors when debugging
  function unhandledRejection (promise) {
    serv.warn('-------------------------------')
    serv.warn('Please report this error to flying-squid! This is can be bug')
    serv.warn('Unhandled rejection warning!')
    serv.warn('Error: ' + promise)
    serv.warn('Report this error here: https://github.com/PrismarineJS/flying-squid/issues')
    serv.warn('-------------------------------')
    serv.emit('unhandledRejectionWarning')
  }

  function uncaughtException (err) {
    serv.err('-------------------------------')
    serv.err('Please report this error to flying-squid! This is can be bug')
    serv.err('Something went wrong!')
    serv.err('Error: ' + err.stack)
    serv.err('Report this error here: https://github.com/PrismarineJS/flying-squid/issues')
    serv.err('-------------------------------')
    serv.emit('crash')
    serv.quit(`Internal server error. ${err}`)
    process.exit()
  }

  process.on('unhandledRejection', (promise) => { unhandledRejection(promise) })
  process.on('uncaughtException', err => { uncaughtException(err) })
}
