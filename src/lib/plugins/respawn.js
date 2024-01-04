module.exports.player = function (player, serv, { version }) {
  const mcData = require('minecraft-data')(version)

  player._client.on('client_command', (data) => {
    let actionId

    if (mcData.supportFeature('respawnIsPayload')) {
      actionId = data.payload
    } else if (mcData.supportFeature('respawnIsActionId')) {
      actionId = data.actionId
    }

    if (actionId === 0) {
      player.behavior('requestRespawn', {}, () => {
        player._client.write('respawn', {
          previousGameMode: player.prevGameMode,
          dimension: (mcData.supportFeature('dimensionIsAString') || mcData.supportFeature('dimensionIaAWorld')) ? serv.dimensionNames[0] : 0,
          worldName: serv.dimensionNames[0],
          difficulty: serv.difficulty,
          hashedSeed: serv.hashedSeed,
          gamemode: player.gameMode,
          levelType: 'default',
          isDebug: false,
          isFlat: false,
          copyMetadata: false
        })
        player.sendSelfPosition()
        player.updateHealth(20)
        player.nearbyEntities = []
        player.updateAndSpawn()
      })
    }
  })
}
