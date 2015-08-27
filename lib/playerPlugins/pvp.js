module.exports=inject;

function inject(serv, player) 
{
  function attackEntity(entityId) 
  {
    var attackedPlayer = serv.entities[entityId].player;
    attackedPlayer.entity.health -= 1;
    attackedPlayer._client.write('update_health', {
      food: attackedPlayer.entity.food,
      foodSaturation: 0.0,
      health: attackedPlayer.entity.health
    });

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

  player._client.on("use_entity", function(packet) {
    if(packet.mouse == 1) {
      attackEntity(packet.target);
    }
  });

}