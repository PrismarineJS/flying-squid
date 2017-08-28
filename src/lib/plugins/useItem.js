const items=require("minecraft-data")(require("flying-squid").version).items;
const Item = require("prismarine-item")(require("flying-squid").version);
const Vec3 = require("vec3").Vec3;

module.exports.player=function(player,serv)
{
  player._client.on("block_place",({location, direction} = {}) => {
    let {heldItem} = player

    if (direction == -1 || heldItem.blockId == -1 || !items[heldItem.blockId]) return;
    const item=Item.fromNotch(heldItem);
    const referencePosition = new Vec3(location.x, location.y, location.z);
    const directionVector = directionToVector[direction];
    const position = referencePosition.plus(directionVector);

    if(item.name=="flint_and_steel")
      player.use_flint_and_steel(referencePosition,directionVector,position);
    else if(item.name=="spawn_egg")
      serv.spawnMob(item.metadata,player.world,position);
  });
};
const directionToVector=[new Vec3(0,-1,0),new Vec3(0,1,0),new Vec3(0,0,-1),new Vec3(0,0,1),new Vec3(-1,0,0),new Vec3(1,0,0)];