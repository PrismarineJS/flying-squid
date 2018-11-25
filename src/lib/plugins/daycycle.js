module.exports.server = function (serv) {
  serv.setTime = (time) => {
    serv.time = time
    serv._writeAll('update_time', {
      age: [0, 0], // TODO
      time: [0, serv.time]
    })
  }

  serv.doDaylightCycle = true

  serv.time = 0

  serv.on('tick', (delta, count) => {
    if (!serv.doDaylightCycle) return
    if (count % 20 === 0) {
      serv.behavior('changeTime', {
        old: serv.time,
        newTime: serv.time + 20
      }, ({ newTime }) => {
        serv.setTime(newTime % 24000) // Vanilla only does it every second
      })
    }
  })
}

module.exports.player = function (player, serv) {
  player.commands.add({
    base: 'night',
    info: 'to change a time to night',
    usage: '/night',
    op: true,
    action () {
      return player.handleCommand('time set night')
    }
  })

  player.commands.add({
    base: 'time',
    info: 'to change a time',
    usage: '/time <add|query|set> <value>',
    op: true,
    parse (str) {
      const data = str.match(/^(add|query|set)(?: ([0-9]+|day|night))?/)
      if (!data) return false
      return {
        action: data[1],
        value: data[2] === 'day' ? 1000 : (data[2] === 'night' ? 13000 : parseInt(data[2]))
      }
    },
    action ({ action, value }) {
      if (action === 'query') {
        player.chat('It is ' + serv.time)
      } else {
        let newTime

        if (action === 'set') {
          newTime = value
        } else if (action === 'add') {
          newTime = value + serv.time
        }

        player.chat('Time was changed from ' + serv.time + ' to ' + newTime)
        serv.setTime(newTime)
      }
    }
  })

  player.commands.add({
    base: 'day',
    info: 'to change a time to day',
    usage: '/day',
    op: true,
    action () {
      return player.handleCommand('time set day')
    }
  })
}
