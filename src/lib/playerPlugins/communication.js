module.exports=inject;

function inject(serv,player)
{
  player._writeOthers= (packetName, packetFields) =>
    player
      .getOthers()
      .forEach((otherPlayer) => otherPlayer._client.write(packetName, packetFields));

  player._writeOthersNearby = (packetName, packetFields) =>
    serv._writeArray(packetName, packetFields, player.nearbyPlayers());

  player.getOthers = () => serv.players.filter((otherPlayer) => otherPlayer != player);

  player.getNearbyPlayers = (radius=player.entity.viewDistance*32) => serv.getNearby({
    world: player.world,
    position: player.position,
    radius: radius
  });

  player.nearbyPlayers = (radius=player.entity.viewDistance*32) => player.entity.nearbyEntities
    .filter(e => e.type == 'player')
    .map(e => e.player);
}