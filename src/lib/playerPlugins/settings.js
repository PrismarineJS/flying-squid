module.exports=inject;

function inject(serv,player)
{
  player.gameMode=serv.gameMode;
  player.spawnPoint=serv.getSpawnPoint();
}