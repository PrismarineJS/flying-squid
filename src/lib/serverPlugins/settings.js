var vec3=require("vec3");

module.exports=inject;

function inject(serv,settings)
{
  serv.gameMode=settings.gameMode;
  serv.spawnPoints=[new vec3(6,138,6),new vec3(3,138,6),new vec3(8,138,6)];
}
