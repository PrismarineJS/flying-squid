export const player = function (player: Player, serv: Server, settings: Options) {
  player.playerlistUpdateText = (header, footer) =>
    player._client.write('playerlist_header', {
      header: JSON.stringify(header),
      footer: JSON.stringify(footer)
    })

  if (settings['player-list-text']) {
    player.playerlistUpdateText(settings['player-list-text'].header || { text: '' }, settings['player-list-text'].footer || { text: '' })
  }
}
declare global {
  interface Player {
    /** @internal */
    "playerlistUpdateText": (header: any, footer: any) => void
  }
}
