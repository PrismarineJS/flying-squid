let playersonline = 0

module.exports.player = async function (player, serv, settings) {
  player.on('connected', () => {
    if (playersonline > settings['max-players']) {
      player.kick('The server is full')
    }

    playersonline++
  })

  player.on('disconnected', () => {
    playersonline--
  })
}
