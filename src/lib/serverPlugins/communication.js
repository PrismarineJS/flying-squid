module.exports=inject;

function inject(serv,settings)
{
  serv._writeAll=function(packetName, packetFields) {
    serv.players.forEach(function (player) {
      player._client.write(packetName, packetFields);
    });
  };

  serv._writeArray=function(packetName, packetFields, players) {
    players.forEach(function(player) {
      player._client.write(packetName, packetFields);
    });
  }

  serv._writeNearby=function(packetName, packetFields, loc) {
    serv._writeArray(packetName, packetFields, serv.getNearby(loc));
  }

  serv.getNearby=function(loc) {
    return serv.players.filter(function(player) {
      return player.world == loc.world && player.entity.position.distanceTo(loc.position) <= loc.radius;
    });
  }
}