module.exports=inject;

function inject(serv,player)
{
  player._writeOthers= (packetName, packetFields) =>
    player
      .getOthers()
      .forEach((otherPlayer) => otherPlayer._client.write(packetName, packetFields));

  player._writeOthersNearby = (packetName, packetFields) =>
    serv._writeArray(packetName, packetFields, player.nearbyPlayers);

  player.getOthers = () => serv.players.filter((otherPlayer) => otherPlayer != player);

  player.getNearby = () => serv
    .getNearby({
      world: player.world,
      position: player.entity.position,
      radius: player.playerViewDistance*32
    })
    .filter((p) => p != player);
}