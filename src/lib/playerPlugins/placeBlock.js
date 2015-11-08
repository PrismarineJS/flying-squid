var blocks=require("minecraft-data")(require("../version")).blocks;
var vec3 = require("vec3");

var materialToSound = {
  undefined: 'stone',
  'rock': 'stone',
  'dirt': 'grass',
  'plant': 'grass',
  'wool': 'cloth',
  'web': 'cloth',
  'wood': 'wood'
}

module.exports=inject;

function inject(serv,player)
{
  player._client.on("block_place",({direction,heldItem,location} = {}) => {
    if(direction==-1 || heldItem.blockId==-1) return;
    var referencePosition=new vec3(location.x,location.y,location.z);
    var directionVector=directionToVector[direction];
    var placedPosition=referencePosition.plus(directionVector);
    player.world.getBlockType(referencePosition).then((id) => {
      if([25].indexOf(id) != -1) return;
      var sound = 'dig.' + (materialToSound[blocks[heldItem.blockId].material] || 'stone');
      serv.playSound(sound, player.world, placedPosition.clone().add(vec3(0.5, 0.5, 0.5)), {
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
}

var directionToVector=[new vec3(0,-1,0),new vec3(0,1,0),new vec3(0,0,-1),new vec3(0,0,1),new vec3(-1,0,0),new vec3(1,0,0)];
