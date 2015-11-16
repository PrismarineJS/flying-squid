var vec3=require("vec3");


function randomInt (low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}

module.exports.server=function(serv,settings)
{
  serv.gameMode=settings.gameMode;

  serv.getSpawnPoint = () =>  new vec3(randomInt(5,20),81,randomInt(5,20));
};


module.exports.player=function(serv,player)
{
  player.gameMode=serv.gameMode;
  player.spawnPoint=serv.getSpawnPoint();
  player._client.on('settings',({viewDistance}) => {
    player.view=viewDistance;
  });
};