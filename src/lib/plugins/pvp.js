var Vec3 = require("vec3").Vec3;

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
    var attackedEntity = serv.entities[entityId];
    if(!attackedEntity || (attackedEntity.gameMode != 0 && attackedEntity.type == 'player')) return;

    attackedEntity.updateHealth(attackedEntity.health - 1);
    serv.playSound('game.player.hurt', player.world, attackedEntity.position.scaled(1/32));

    var attackVelocity = attackedEntity.position.minus(player.position).plus(new Vec3(0, 0.5, 0)).scaled(5/32);
    attackedEntity.sendVelocity(attackVelocity, new Vec3(4, 4, 4));

    if(attackedEntity.health<=0)
      attackedEntity._writeOthers('entity_status',{
        entityId:attackedEntity.id,
        entityStatus:3
      });
    else
      attackedEntity._writeOthers('animation',{
      entityId:attackedEntity.id,
      animation:1
    });
  }

  player._client.on("use_entity", ({mouse,target} = {}) => {
    if(mouse == 1)
      attackEntity(target);
  });

};

module.exports.entity=function(entity,serv)
{
  if (entity.type != 'player') {
    entity.updateHealth = (health) => {
      entity.health = health;
    }
  }
}