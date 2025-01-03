module.exports.player = function (player, serv, { version }) {
  player._client.on('client_command', (data) => {
    let actionId

    if (serv.supportFeature('respawnIsPayload')) {
      actionId = data.payload
    } else if (serv.supportFeature('respawnIsActionId')) {
      actionId = data.actionId
    }

    if (actionId === 0) {
      player.behavior('requestRespawn', {}, () => {
        player._sendRespawn()
        player.sendSelfPosition()
        player.updateHealth(20)
        player.nearbyEntities = []
        player.updateAndSpawn()
      })
    }
  })

  player._sendRespawn = function (newDifficulty, newGameMode, newDimension) {
    player._client.write('respawn', {
      previousGameMode: player.prevGameMode,
      dimension: serv.registry.loginPacket?.dimension || 0,
      worldName: serv.dimensionNames[newDimension || 0],
      difficulty: newDifficulty ?? serv.difficulty,
      hashedSeed: serv.hashedSeed,
      gamemode: newGameMode ?? player.gameMode,
      levelType: 'default',
      isDebug: false,
      isFlat: false,
      copyMetadata: false,
      portalCooldown: 0 // 1.20
    })
  }
}
