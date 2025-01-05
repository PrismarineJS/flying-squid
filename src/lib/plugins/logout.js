const { once } = require('events')

module.exports.server = function (serv) {
  serv.quit = async (reason = 'Server closed') => {
    await Promise.all(serv.players.map((player) => {
      player.kick(reason)
      return once(player, 'disconnected')
    }))
    await serv.destroy()
  }
}

module.exports.player = function (player, serv, { worldFolder }) {
  player.despawnEntities = entities => player._client.write('entity_destroy', {
    entityIds: entities.map(e => e.id)
  })

  player._client.on('end', async () => {
    if (!player.disconnected) {
      player._unloadAllChunks(true /* becasuePlayerLeft */)
      if (player.username) serv.broadcast(serv.color.yellow + player.username + ' left the game.')
      serv._sendPlayerEventLeave(player)
      player.nearbyPlayers().forEach(otherPlayer => otherPlayer.despawnEntities([player]))
      delete serv.entities[player.id]
      player.emit('disconnected')
      const index = serv.players.indexOf(player)
      if (index > -1) {
        serv.players.splice(index, 1)
      }
      delete serv.uuidToPlayer[player.uuid]
      player.disconnected = true
    }

    player.save()
    player._client.socket?.destroy()
  })
}
