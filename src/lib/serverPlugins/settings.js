var vec3=require("vec3");

module.exports=inject;


function randomInt (low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}

function inject(serv,settings)
{
  serv.gameMode=settings.gameMode;

  serv.getSpawnPoint = () =>  new vec3(randomInt(5,20),81,randomInt(5,20));
}
