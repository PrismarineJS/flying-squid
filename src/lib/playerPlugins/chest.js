var vec3 = require("vec3");

module.exports=inject;

function inject(serv, player)
{
  player._client.on('block_place', async function (packet) {
    var referencePosition=new vec3(packet.location.x,packet.location.y,packet.location.z);
    if (player.entity.crouching) return;
    try {
      var id = await serv.world.getBlockType(referencePosition);
      var blockAbove = await serv.world.getBlockType(referencePosition.clone().add(new vec3(0, 1, 0)));

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
      setTimeout(function(){throw err;},0);
    }
    
  });
}