var blocks=require("minecraft-data")(require("flying-squid").version).blocks;
var Vec3 = require("vec3").Vec3;

var materialToSound = {
  undefined: 'stone',
  'rock': 'stone',
  'dirt': 'grass',
  'plant': 'grass',
  'wool': 'cloth',
  'web': 'cloth',
  'wood': 'wood'
};

module.exports.player=function(player,serv)
{
  player._client.on("block_place",({direction,heldItem,location} = {}) => {
    if(direction==-1 || heldItem.blockId==-1) return;
    var referencePosition=new Vec3(location.x,location.y,location.z);
    var directionVector=directionToVector[direction];
    var placedPosition=referencePosition.plus(directionVector);
    player.behavior('placeBlock', {
      direction: directionVector,
      heldItem: heldItem,
      id: heldItem.blockId,
      damage: heldItem.itemDamage,
      position: placedPosition,
      reference: referencePosition,
      playSound: true,
      sound: 'dig.' + ((blocks[heldItem.blockId] && materialToSound[blocks[heldItem.blockId].material]) || 'stone')
    }, ({direction, heldItem, position, playSound, sound, id, damage}) => {
      if (!blocks[id]) return false;
      if (playSound) {
        serv.playSound(sound, player.world, placedPosition.clone().add(new Vec3(0.5, 0.5, 0.5)), {
          pitch: 0.8
        });
      }
      if(heldItem.blockId!=323){
          player.changeBlock(position, id, damage);
      }else if(direction==1){
        player.setBlock(position, 63, 0);
          player._client.write('open_sign_entity', {
              location:position
          });
      }else{
        player.setBlock(position, 68, 0);
          player._client.write('open_sign_entity', {
              location:position
          });
      }
    }, async () => {
      var id = await player.world.getBlockType(placedPosition);
      var damage = await player.world.getBlockData(placedPosition);
      player.sendBlock(placedPosition, id, damage);
    });
  });
};

var directionToVector=[new Vec3(0,-1,0),new Vec3(0,1,0),new Vec3(0,0,-1),new Vec3(0,0,1),new Vec3(-1,0,0),new Vec3(1,0,0)];
