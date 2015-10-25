module.exports=inject;

function inject(serv,player)
{
  player._writeOthers=function(packetName, packetFields) {
    player.getOthers().forEach(function (otherPlayer) {
      otherPlayer._client.write(packetName, packetFields);
    });
  };

  player._writeOthersNearby = function(packetName, packetFields) {
    serv._writeArray(packetName, packetFields, player.getNearby());
  }

  player.getOthers = function() {
    return serv.players.filter(function (otherPlayer) {
      return otherPlayer != player;
    });
  };

  player.getNearby = function() {
    return serv.getNearby({
      world: player.world,
      position: player.entity.position,
      radius: 150*32
    }).filter((p) => p != player);
  }
}