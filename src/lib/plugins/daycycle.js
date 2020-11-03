const pc = require('prismarine-chat')
const { supportedVersions } = require('../version')

module.exports.server = function (serv, { version }) {
  const ChatMessage = pc(version)

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
        const queryMessage = {
          translate: 'commands.time.query',
          with: [{ text: String(serv.time) }]
        }

        if (ctx.player) ctx.player.chat(queryMessage)
        else serv.info(new ChatMessage(queryMessage))
      } else {
        if (isNaN(value)) {
          let invalidNumMessage

          if (supportedVersions.indexOf(version) < 5) {
            invalidNumMessage = {
              translate: 'commands.generic.num.invalid',
              with: [{ text: String(value) }]
            }
          } else {
            invalidNumMessage = {
              translate: 'argument.time.invalid_unit'
            }
          }

          if (ctx.player) return ctx.player.chat(invalidNumMessage)
          return serv.info(new ChatMessage(invalidNumMessage))
        } else {
          let newTime

          let message

          if (action === 'set') {
            newTime = value

            message = {
              translate: 'commands.time.set',
              with: [{ text: String(newTime) }]
            }
          } else if (action === 'add') {
            newTime = value + serv.time

            if (supportedVersions.indexOf(version) < 5) {
              message = {
                translate: 'commands.time.added',
                with: [{ text: String(value) }]
              }
            } else {
              message = {
                translate: 'commands.time.set',
                with: [{ text: String(newTime) }]
              }
            }
          }

          serv.setTime(newTime)

          if (ctx.player) return ctx.player.chat(message)
          return serv.info(new ChatMessage(message))
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
    action (_, ctx) {
      return ctx.player ? ctx.player.handleCommand('time set day') : serv.handleCommand('time set day')
    }
  })

  serv.commands.add({
    base: 'night',
    info: 'to change a time to night',
    usage: '/night',
    tab: [],
    op: true,
    action (_, ctx) {
      return ctx.player ? ctx.player.handleCommand('time set day') : serv.handleCommand('time set day')
    }
  })
}
