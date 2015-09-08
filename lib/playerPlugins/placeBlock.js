var vec3 = require("vec3");

module.exports=inject;

function inject(serv,player)
{
  player._client.on("block_place",function(packet){
    if(packet.direction==-1 || packet.heldItem.blockId==-1) return;
    var referencePosition=new vec3(packet.location.x,packet.location.y,packet.location.z);
    var directionVector=directionToVector[packet.direction];
    var placedPosition=referencePosition.plus(directionVector);
    if(packet.heldItem.blockId!=323){
        player.changeBlock(placedPosition,packet.heldItem.blockId);
    }else if(packet.direction==1){
        serv.setBlock(placedPosition, 63);
        player._client.write('open_sign_entity', {
            location:placedPosition
        });
    }else{
        serv.setBlock(placedPosition, 68);
        player._client.write('open_sign_entity', {
            location:placedPosition
        });
    }
  });
}

var directionToVector=[new vec3(0,-1,0),new vec3(0,1,0),new vec3(0,0,-1),new vec3(0,0,1),new vec3(-1,0,0),new vec3(1,0,0)];
