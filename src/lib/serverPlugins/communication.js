module.exports=inject;

function inject(serv,settings)
{
  serv._writeAll= (packetName, packetFields) =>
    serv.players.forEach((player) => player._client.write(packetName, packetFields));

  serv._writeArray= (packetName, packetFields, players) =>
    players.forEach((player) =>player._client.write(packetName, packetFields));

  serv._writeNearby= (packetName, packetFields, loc) =>
    serv._writeArray(packetName, packetFields, serv.getNearby(loc));

  serv.getNearby= loc => serv.players.filter( player =>
      player.world == loc.world &&
      player.entity.position.distanceTo(loc.position) <= loc.radius
  );
}