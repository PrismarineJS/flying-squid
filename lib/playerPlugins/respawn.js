module.exports=inject;

function inject(serv, player)
{
  player._client.on("client_command", function(packet) {
    if(packet.payload == 0) {
      
    }
  });
}