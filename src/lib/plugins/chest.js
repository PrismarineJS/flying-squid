var Vec3 = require("vec3").Vec3;

module.exports.player=function(player)
{
  player._client.on('block_place', async ({location} = {}) => {
    var referencePosition=new Vec3(location.x,location.y,location.z);
    if (player.crouching) return;
    try {
      var id = await player.world.getBlockType(referencePosition);
      var blockAbove = await player.world.getBlockType(referencePosition.clone().add(new Vec3(0, 1, 0)));
      if (id == 54) {
        if (blockAbove) {
          return;
        }
        player._client.write("open_window", {
          windowId: 165,
          inventoryType: "minecraft:chest",
          windowTitle: JSON.stringify("Chest"),
          slotCount: 9 * 3 + 8 // 3 rows, make nicer later
        });
      }
    }
    catch(err) {
      setTimeout(() =>{throw err;},0);
    }
    
  });
}