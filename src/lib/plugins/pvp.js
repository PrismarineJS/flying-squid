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

    player.behavior('attack', {
      attackedEntity: attackedEntity,
      sound: 'game.player.hurt',
      playSound: true,
      damage: 1,
      velocity: attackedEntity.position.minus(player.position).plus(new Vec3(0, 0.5, 0)).scaled(5),
      maxVelocity: new Vec3(4, 4, 4),
      animation: true
    }, ({entity, sound, playSound, damage, velocity, maxVelocity, animation}) => {
      attackedEntity.updateHealth(attackedEntity.health - dealDamage);
    serv.playSound(sound, player.world, attackedEntity.position.scaled(1/32));

      attackedEntity.sendVelocity(velocity.scaled(1/32), maxVelocity);

      if(attackedEntity.health<=0 && animation)
        attackedEntity._writeOthers('entity_status',{
          entityId:attackedEntity.id,
          entityStatus:3
        });
      else if (animation)
        attackedEntity._writeOthers('animation',{
        entityId:attackedEntity.id,
        animation:1
      });
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