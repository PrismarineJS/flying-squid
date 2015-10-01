module.exports=inject;

function randomInt (low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}

function inject(serv,player)
{
  player.gameMode=serv.gameMode;
  player.spawnPoint=serv.spawnPoints[randomInt(0,serv.spawnPoints.length)];
}