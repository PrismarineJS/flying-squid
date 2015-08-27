module.exports=inject;

function inject(serv, player)
{
  player._client.on("client_command", function(packet) {
    if(packet.payload == 0) {
      player._client.write("respawn",{
        dimension:0,
        difficulty:0,
        gamemode:player.gameMode,
        levelType:'default'
      });
      player.sendInitialPosition();
      player.spawn();
    }
  });
}