module.exports.player = function (player, serv, settings) {
  player.playerlistUpdateText = function (header, footer) {
    player._client.write('playerlist_header', {
      header: serv._createChatComponent(header).toNetworkFormat(),
      footer: serv._createChatComponent(footer).toNetworkFormat()
    })
  }

  const header = settings['player-list-text'].header || ''
  const footer = settings['player-list-text'].footer || ''

  if (settings['player-list-text']) {
    player.playerlistUpdateText(header, footer)
  }
}
