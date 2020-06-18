const EventEmitter = require('events')

function stdinLineByLine () {
  const stdin = new EventEmitter()
  let buff = ''

  process.stdin
    .on('data', data => {
      buff += data
      var lines = buff.split(/[\r\n|\n]/)
      buff = lines.pop()
      lines.forEach(line => {
        if (line !== '') {
          stdin.emit('line', line)
        }
      })
    })
    .on('end', () => {
      if (buff.length > 0) stdin.emit('line', buff)
    })

  return stdin
}

const stdin = stdinLineByLine()

module.exports.server = function (serv) {
  stdin.on('line', (data) => {
    serv.handleCommand(data)
  })
}
