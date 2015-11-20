module.exports.player=function(player,serv)
{
  player.despawnPlayers = despawnedPlayers => {
    player._client.write('entity_destroy', {
      'entityIds': despawnedPlayers.map(p => p.entity.id)
    });
  };

  player.despawnEntities = entities => player._client.write('entity_destroy', {
    'entityIds': entities.map(e => e.id)
  });

  player._client.on('end', () => {
    if(player) {
      serv.broadcast(player.username + ' quit the game.', "yellow");
      player._writeOthers('player_info', {
        action: 4,
        data: [{
          UUID: player._client.uuid
        }]
      });
      player.nearbyPlayers().forEach(otherPlayer => otherPlayer.despawnPlayers([player]));
      delete serv.entities[player.id];
      player.emit('disconnected');
      var index = serv.players.indexOf(player);
      if (index > -1) {
        serv.players.splice(index, 1);
      }
      delete serv.uuidToPlayer[player._client.uuid];
    }
  });
};