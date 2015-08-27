var vec3=require("vec3");

module.exports=inject;

function inject(serv,settings)
{
  serv.gameMode=settings.gameMode;
  serv.spawnPoints=[new vec3(6,51,6),new vec3(3,51,6),new vec3(8,51,6)];
}