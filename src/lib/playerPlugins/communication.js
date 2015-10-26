module.exports=inject;

function inject(serv,player)
{
  player._writeOthers= (packetName, packetFields) => {
    player.getOthers().forEach(function (otherPlayer) {
      otherPlayer._client.write(packetName, packetFields);
    });
  };

  player._writeOthersNearby = (packetName, packetFields) => {
    serv._writeArray(packetName, packetFields, player.nearbyPlayers);
  };

  player.getOthers = () => {
    return serv.players.filter(function (otherPlayer) {
      return otherPlayer != player;
    });
  };

  player.getNearby = () => {
    return serv.getNearby({
      world: player.world,
      position: player.entity.position,
      radius: player.playerViewDistance*32
    }).filter((p) => p != player);
  }
}