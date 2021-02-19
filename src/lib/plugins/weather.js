const { literal } = require('node-brigadier')

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

module.exports.brigadier = (dispatcher, serv) => {
  dispatcher.register(
    literal('weather')
      .then(literal('thunder')
        .executes(executor))
      .then(literal('rain')
        .executes(executor))
      .then(literal('clear')
        .executes(executor)))
}

function executor (ctx) {
  const { serv } = ctx.getSource()
  const [, weatherType] = ctx.input.split(' ')
  changeWeather(serv, weatherType)
}
