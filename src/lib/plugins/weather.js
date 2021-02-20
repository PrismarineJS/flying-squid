const { literal, float, argument } = require('node-brigadier')

const WEATHER_REASON = {
  thunder: 8,
  rain: 2,
  clear: 1
}

function changeWeather (serv, weatherType, intensity = 0) {
  const reason = WEATHER_REASON[weatherType]
  if (weatherType === 'thunder') { // thunder requires rain to render
    serv._writeAll('game_state_change', { reason: WEATHER_REASON.rain, gameMode: intensity })
  }
  serv._writeAll('game_state_change', { reason, gameMode: intensity })
}

function clearWeather (serv) {
  serv._writeAll('game_state_change', { reason: WEATHER_REASON.clear, gameMode: 0 })
}

module.exports.brigadier = (dispatcher) => {
  const durationArg = argument('duration', float(0, 1000000))
  for (const reason of Object.keys(WEATHER_REASON)) {
    // with time
    dispatcher.register(
      literal('weather')
        .requires(ctx => ctx.player.op)
        .then(literal(reason)
          .then(durationArg
            .executes(executor))))
    // without time
    dispatcher.register(
      literal('weather')
        .requires(ctx => ctx.player.op)
        .then(literal(reason)
          .executes(executor)))
  }
}

const toMs = (sec) => sec * 1000
let currTimeout = null

function executor (ctx) {
  const { serv } = ctx.getSource()
  const [, weatherType, duration = toMs(5 * 60)] = ctx.input.split(' ')
  changeWeather(serv, weatherType)
  if (currTimeout !== null) clearTimeout(currTimeout)
  currTimeout = setTimeout(() => clearWeather(serv), toMs(duration))
}
