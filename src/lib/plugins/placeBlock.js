var blocks=require("minecraft-data")(require("../version")).blocks;
var Vec3 = require("vec3").Vec3

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
    player.world.getBlockType(referencePosition).then((id) => {
      if([25].indexOf(id) != -1) return;
      var sound = 'dig.' + (materialToSound[blocks[heldItem.blockId].material] || 'stone');
      serv.playSound(sound, player.world, placedPosition.clone().add(new Vec3(0.5, 0.5, 0.5)), {
        pitch: 0.8
      });
      if(heldItem.blockId!=323){
          player.changeBlock(placedPosition,heldItem.blockId,heldItem.itemDamage);
      }else if(direction==1){
        player.setBlock(placedPosition, 63, 0);
          player._client.write('open_sign_entity', {
              location:placedPosition
          });
      }else{
        player.setBlock(placedPosition, 68, 0);
          player._client.write('open_sign_entity', {
              location:placedPosition
          });
      }
    }).catch((err)=> setTimeout(() => {throw err;},0));
  });
};

var directionToVector=[new Vec3(0,-1,0),new Vec3(0,1,0),new Vec3(0,0,-1),new Vec3(0,0,1),new Vec3(-1,0,0),new Vec3(1,0,0)];
