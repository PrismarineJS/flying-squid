module.exports=inject;

function inject(serv,player)
{
  player._writeOthers=function(packetName, packetFields) {
    player.getOthers().forEach(function (otherPlayer) {
      otherPlayer._client.write(packetName, packetFields);
    });
  };

  player.getOthers = function() {
    return serv.players.filter(function (otherPlayer) {
      return otherPlayer != player
    });
  };
}