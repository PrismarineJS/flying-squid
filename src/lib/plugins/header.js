module.exports.player = function (player, serv, settings) {
  player.playerlistUpdateText = (header, footer) =>
    player._client.write('playerlist_header', {
      header: JSON.stringify(header),
      footer: JSON.stringify(footer)
    })

  if (settings['player-list-text']) {
    player.playerlistUpdateText(settings['player-list-text'].header || { text: '' }, settings['player-list-text'].footer || { text: '' })
  }
}
