module.exports.player=function(player,serv)
{

  player.updateHealth = (health) => {
    player.health = health;
    player._client.write('update_health', {
      food: player.food,
      foodSaturation: 0.0,
      health: player.health
    });
  };

  function attackEntity(entityId) 
  {
    if (!serv.entities[entityId]) return; // ?????
    var attackedPlayer = serv.entities[entityId].player;
    if(!attackedPlayer || attackedPlayer.gameMode!=0)  return;
    attackedPlayer.updateHealth(attackedplayer.health - 1);
    serv.playSound('game.player.hurt', player.world, attackedplayer.position.scaled(1/32));

    if(attackedplayer.health==0)
      attackedPlayer._writeOthers('entity_status',{
        entityId:attackedplayer.id,
        entityStatus:3
      });
    else
      attackedPlayer._writeOthers('animation',{
      entityId:attackedplayer.id,
      animation:1
    });
  }

  player._client.on("use_entity", ({mouse,target} = {}) => {
    if(mouse == 1)
      attackEntity(target);
  });

};