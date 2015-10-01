module.exports=inject;

function inject(serv,settings)
{
  serv._writeAll=function(packetName, packetFields) {
    serv.players.forEach(function (player) {
      player._client.write(packetName, packetFields);
    });
  };
}