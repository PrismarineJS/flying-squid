module.exports=inject;

function transformUuid(s)
{
  return s.split("-").map(function(item) { return parseInt(item, 16); });
}

function inject(serv,player)
{
  player._client.on('end', function () {
    serv.broadcast(player.username + ' quit the game.', "yellow");
    player._writeOthers('player_info', {
      action: 4,
      data: [{
        UUID: transformUuid(player._client.uuid)
      }]
    });
    player._writeOthers('entity_destroy', {'entityIds': [player.entity.id]});
    delete serv.entities[player.entity.id];
    player.emit('disconnected');
    var index = serv.players.indexOf(player);
    if (index > -1) {
      serv.players.splice(index,1);
    }
    delete serv.uuidToPlayer[player._client.uuid];
  });


  player._client.on('error', function (error) {
    player.emit('error',error);
  });
}