import once from 'event-promise'

export const server = function (serv: Server) {
  serv.quit = async (reason = 'Server closed') => {
    await Promise.all(serv.players.map((player) => {
      player.kick(reason)
      return once(player, 'disconnected')
    }))
    serv._server.close()
    await once(serv._server, 'close')
  }
}

export const player = function (player: Player, serv: Server, { worldFolder }: Options) {
  player.despawnEntities = entities => player._client.write('entity_destroy', {
    entityIds: entities.map(e => e.id)
  })

  player._client.on('end', async () => {
    if (player && player.username) {
      player._unloadAllChunks()
      serv.broadcast(serv.color.yellow + player.username + ' left the game.')
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

    player.save()
    player._client.socket?.destroy()
  })
}
declare global {
  interface Server {
    /** @internal */
    'quit': (reason?: string) => Promise<void>
  }
  interface Player {
    /** @internal */
    'despawnEntities': (entities: any) => void
  }
}
