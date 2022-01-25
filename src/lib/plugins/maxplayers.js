module.exports.player = async function (player, serv, settings) {
  serv.playersonline = 0

  player.on('connected', () => {
    if (serv.playersonline > settings['max-players']) {
      player.kick('The server is full')
      serv.emit('full')
    }

    serv.playersonline++
  })

  player.on('disconnected', () => {
    serv.playersonline--
  })
}
