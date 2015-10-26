module.exports=inject;

function inject(serv,settings)
{
  serv._writeAll= (packetName, packetFields) => {
    serv.players.forEach(function (player) {
      player._client.write(packetName, packetFields);
    });
  };

  serv._writeArray= (packetName, packetFields, players) => {
    players.forEach(function(player) {
      player._client.write(packetName, packetFields);
    });
  };

  serv._writeNearby= (packetName, packetFields, loc) => {
    serv._writeArray(packetName, packetFields, serv.getNearby(loc));
  };

  serv.getNearby= loc => {
    return serv.players.filter(function(player) {
      return player.world == loc.world && player.entity.position.distanceTo(loc.position) <= loc.radius;
    });
  };
}