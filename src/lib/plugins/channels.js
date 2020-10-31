const PLAY = require('minecraft-protocol').states.PLAY

module.exports.player = (player) => {
  player.sendBrand = async (brand = 'flying-squid') => {
    if (player._client.state !== PLAY) throw new Error(`The state of the player must be PLAY (actual state: ${player._client.state})`)
    player._client.writeChannel((
      player._client.protocolVersion >= 385 // (385 = 1.13-pre3) as of 1.13 (The Flattening), the name of the default channels has changed
        ? 'brand'
        : 'MC|Brand'
    ), brand)
  }
  player.on('spawned', () => {
    player._client.registerChannel((
      player._client.protocolVersion >= 385 // (385 = 1.13-pre3) as of 1.13 (The Flattening), the name of the default channels has changed
        ? 'brand'
        : 'MC|Brand'
    ), ['string', []])
    player.sendBrand()
  })
}
