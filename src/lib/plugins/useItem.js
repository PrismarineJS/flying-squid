var items=require("minecraft-data")(require("flying-squid").version).items;
var Vec3 = require("vec3").Vec3;
var {detectFrame,getAir}=require("flying-squid").portal_detector;

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

  player.use_flint_and_steel=async (referencePosition,direction) => {
    let block=await player.world.getBlock(referencePosition);
    if(block.name=="obsidian")
    {
      var frames=await detectFrame(player.world,referencePosition,direction);
      if(frames.length==0)
        return;
      var air=getAir(frames[0]);
      air.forEach(pos => player.setBlock(pos,81,0))
    }
  };
};
var directionToVector=[new Vec3(0,-1,0),new Vec3(0,1,0),new Vec3(0,0,-1),new Vec3(0,0,1),new Vec3(-1,0,0),new Vec3(1,0,0)];