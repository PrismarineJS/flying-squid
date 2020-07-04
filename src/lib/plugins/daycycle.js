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

  serv.commands.add({
    base: 'night',
    info: 'to change a time to night',
    usage: '/night',
    tab: [],
    op: true,
    action () {
      return serv.handleCommand('time set night')
    }
  })

  serv.commands.add({
    base: 'time',
    info: 'to change a time',
    usage: '/time <add|query|set> <value>',
    tab: ['time'],
    op: true,
    parse (str) {
      const data = str.match(/^(add|query|set)(?: ([0-9]+|day|night))?/)
      if (!data) return false
      return {
        action: data[1],
        value: data[2] === 'day' ? 1000 : (data[2] === 'night' ? 13000 : parseInt(data[2]))
      }
    },
    action ({ action, value }, ctx) {
      if (action === 'query') {
        if (ctx.player) ctx.player.chat('It is ' + serv.time)
        else serv.log('It is ' + serv.time)
      } else {
        if (isNaN(value)) {
          return 'That isn\'t a valid number!'
        } else {
          let newTime

          if (action === 'set') {
            newTime = value
          } else if (action === 'add') {
            newTime = value + serv.time
          }

          if (ctx.player) ctx.player.chat('Time was changed from ' + serv.time + ' to ' + newTime)
          else serv.log('Time was changed from ' + serv.time + ' to ' + newTime)
          serv.setTime(newTime)
        }
      }
    }
  })

  serv.commands.add({
    base: 'day',
    info: 'to change a time to day',
    usage: '/day',
    tab: [],
    op: true,
    action () {
      return serv.handleCommand('time set day')
    }
  })
}
