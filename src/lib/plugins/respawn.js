module.exports.player=function(player)
{
  player._client.on("client_command", ({payload}) => {
    if(payload == 0) {
      player._client.write("respawn",{
        dimension:0,
        difficulty:0,
        gamemode:player.gameMode,
        levelType:'default'
      });
      player.sendPosition();
      player.updateHealth(20);
      player.entity.nearbyEntities=[];
      player.entity.updateAndSpawn();
    }
  });
};