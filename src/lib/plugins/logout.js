const once = require('event-promise')
const playerDat = require('../playerDat')

module.exports.server = function (serv) {
  serv.quit = async (reason = 'Going down') => {
    await Promise.all(serv.players.map((player) => {
      player.kick(reason)
      return once(player, 'disconnected')
    }))
    serv._server.close()
    await once(serv._server, 'close')
  }
}

module.exports.player = function (player, serv, { worldFolder }) {
  player.despawnEntities = entities => player._client.write('entity_destroy', {
    entityIds: entities.map(e => e.id)
  })

  player._client.on('end', async () => {
    if (player && player.username) {
      player.unloadAllChunks()
      serv.broadcast(serv.color.yellow + player.username + ' quit the game.')
      player._writeOthers('player_info', {
        action: 4,
        data: [{
          UUID: player.uuid
        }]
      })
      player.nearbyPlayers().forEach(otherPlayer => otherPlayer.despawnEntities([player]))
      delete serv.entities[player.id]
      player.emit('disconnected')
      const index = serv.players.indexOf(player)
      if (index > -1) {
        serv.players.splice(index, 1)
      }
      delete serv.uuidToPlayer[player.uuid]
    }

    playerDat.save(player, worldFolder, serv.supportFeature('attributeSnakeCase'))
  })
}
