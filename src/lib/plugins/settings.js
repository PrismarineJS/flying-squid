var Vec3 = require("vec3").Vec3;


function randomInt (low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}

module.exports.server=function(serv,settings)
{
  serv.gameMode=settings.gameMode;

  serv.getSpawnPoint = () =>  new Vec3(randomInt(5,20),81,randomInt(5,20));
};


module.exports.player=function(player,serv)
{
  player.gameMode=serv.gameMode;
  player.spawnPoint=serv.getSpawnPoint();
  player._client.on('settings',({viewDistance}) => {
    player.view=viewDistance;
  });
};