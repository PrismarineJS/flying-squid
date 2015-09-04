module.exports=inject;
var cancelEmit = require('../cancelEvents');

function inject(serv, player)
{
  player._client.on("client_command", function(packet) {
    if(packet.payload == 0) {
      var doDefault = cancelEmit(player, 'respawn', {});
      if (!doDefault) return;
      
      player._client.write("respawn",{
        dimension:0,
        difficulty:0,
        gamemode:player.gameMode,
        levelType:'default'
      });
      player.sendInitialPosition();
      player.updateHealth(20);
      player.spawn();
    }
  });
}