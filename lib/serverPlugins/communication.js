module.exports=inject;

function inject(serv)
{
  serv.writeOthers=function(client,packetName, packetFields) {
    serv.otherClients(client).forEach(function (otherClient) {
      otherClient.write(packetName, packetFields);
    });
  };

  serv.otherClients = function(client) {
    return serv.playersConnected.filter(function (otherClient) {
      return otherClient != client
    });
  };
}