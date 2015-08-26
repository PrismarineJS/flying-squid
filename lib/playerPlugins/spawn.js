var vec3 = require("vec3");

module.exports=inject;

function inject(serv,player)
{
  function setSpawnPoint()
  {
    player.spawnPoint=new vec3(6,51,6);
  }

  player.setSpawnPoint=setSpawnPoint;
}