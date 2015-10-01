var vec3 = require("vec3");

module.exports=inject;

function inject(serv, player)
{
  player._client.on('block_place', function (packet) {
    var referencePosition=new vec3(packet.location.x,packet.location.y,packet.location.z);
    var id = serv.world.getBlock(referencePosition).type;
    if(id==54)
      player._client.write("open_window",{
          windowId:165,
          inventoryType:"minecraft:chest",
          windowTitle:JSON.stringify("Chest"),
          slotCount:26
      });
    
  });
}