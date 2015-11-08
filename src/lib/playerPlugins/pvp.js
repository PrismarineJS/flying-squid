module.exports=inject;

function inject(serv, player) 
{

  player.updateHealth = (health) => {
    player.entity.health = health;
    player._client.write('update_health', {
      food: player.entity.food,
      foodSaturation: 0.0,
      health: player.entity.health
    });
  };

  function attackEntity(entityId) 
  {
    if (!serv.entities[entityId]) return; // ?????
    var attackedPlayer = serv.entities[entityId].player;
    if(!attackedPlayer || attackedPlayer.gameMode!=0)  return;
    attackedPlayer.updateHealth(attackedPlayer.entity.health - 1);
    serv.playSound('game.player.hurt', player.world, attackedPlayer.entity.position.scaled(1/32));

    if(attackedPlayer.entity.health==0)
      attackedPlayer._writeOthers('entity_status',{
        entityId:attackedPlayer.entity.id,
        entityStatus:3
      });
    else
      attackedPlayer._writeOthers('animation',{
      entityId:attackedPlayer.entity.id,
      animation:1
    });
  }

  player._client.on("use_entity", ({mouse,target} = {}) => {
    if(mouse == 1)
      attackEntity(target);
  });

}