var items=require("minecraft-data")(require("flying-squid").version).items;
var Vec3 = require("vec3").Vec3;

module.exports.player=function(player,serv)
{
  player._client.on("block_place",({direction,heldItem,location} = {}) => {
    if (direction == -1 || heldItem.blockId == -1 || !items[heldItem.blockId]) return;
    var referencePosition = new Vec3(location.x, location.y, location.z);
    var directionVector = directionToVector[direction];
    var position = referencePosition.plus(directionVector);

    var item= items[heldItem.blockId];
    if(item.name=="flint_and_steel")
      player.use_flint_and_steel(referencePosition,directionVector);
  });
};
var directionToVector=[new Vec3(0,-1,0),new Vec3(0,1,0),new Vec3(0,0,-1),new Vec3(0,0,1),new Vec3(-1,0,0),new Vec3(1,0,0)];