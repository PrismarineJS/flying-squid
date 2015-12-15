var items=require("minecraft-data")(require("flying-squid").version).items;
var Item = require("prismarine-item")(require("flying-squid").version);
var Vec3 = require("vec3").Vec3;

module.exports.player=function(player,serv)
{
  player._client.on("block_place",({direction,heldItem,location} = {}) => {
    if (direction == -1 || heldItem.blockId == -1 || !items[heldItem.blockId]) return;
    var item=Item.fromNotch(heldItem);
    var referencePosition = new Vec3(location.x, location.y, location.z);
    var directionVector = directionToVector[direction];
    var position = referencePosition.plus(directionVector);

    if(item.name=="flint_and_steel")
      player.use_flint_and_steel(referencePosition,directionVector,position);
    else if(item.name=="spawn_egg")
      serv.spawnMob(item.metadata,player.world,position);
  });
};
var directionToVector=[new Vec3(0,-1,0),new Vec3(0,1,0),new Vec3(0,0,-1),new Vec3(0,0,1),new Vec3(-1,0,0),new Vec3(1,0,0)];