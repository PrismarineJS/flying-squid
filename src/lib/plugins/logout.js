module.exports.player=function(player,serv)
{
  player.despawnEntities = entities => player._client.write('entity_destroy', {
    'entityIds': entities.map(e => e.id)
  });

  player._client.on('end', () => {
    if(player) {
      serv.broadcast(serv.color.yellow + player.username + ' quit the game.');
      player._writeOthers('player_info', {
        action: 4,
        data: [{
          UUID: player._client.uuid
        }]
      });
      player.nearbyPlayers().forEach(otherPlayer => otherPlayer.despawnEntities([player]));
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