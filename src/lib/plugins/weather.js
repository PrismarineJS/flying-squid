module.exports.server = function (serv) {
  serv.commands.add({
    base: 'weather',
    info: 'Sets the weather.',
    usage: '/weather <clear|rain>',
    op: true,
    parse (str) {
      const args = str.split(' ')
      if (args.length !== 1) { return false }

      const condition = args[0]
      if (['clear', 'rain'].indexOf(condition) === -1) { return false }

      return { condition }
    },
    action ({ condition }) {
      if (condition === 'rain') {
        serv._writeAll('game_state_change', { reason: 2, gameMode: 0 })
      } else if (condition === 'clear') {
        serv._writeAll('game_state_change', { reason: 1, gameMode: 0 })
      }
    }
  })
}
