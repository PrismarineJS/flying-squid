module.exports=inject;

function inject(serv,player)
{
  player.gameMode=serv.gameMode;
  player.spawnPoint=serv.getSpawnPoint();
  player._client.on('settings',({viewDistance}) => {
    player.view=viewDistance;
  });
}