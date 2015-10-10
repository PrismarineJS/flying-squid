module.exports=inject;

function inject(serv, player)
{
  player.heldItemSlot=0;
  player.heldItem=0;
  player.inventory=new Array(44);
  
  player._client.on("held_item_slot", function (packet) {
    player.heldItemSlot = packet.slotId;
    if(player.inventory[36+player.heldItemSlot]===undefined){
      player.inventory[36+player.heldItemSlot]={
            blockId:-1
        };
    }
    player.heldItem = player.inventory[36+player.heldItemSlot];
    player._writeOthers("entity_equipment",{
        entityId:player.entity.id,
        slot:0,
        item:player.heldItem
    });
  });
  
  player._client.on("set_creative_slot", function (packet) {
    player.inventory[packet.slot]=packet.item;
    if (packet.slot==36)
      player._writeOthers("entity_equipment",{
        entityId:player.entity.id,
        slot:0,
        item:packet.item
      });
    if (packet.slot==5)
            player._writeOthers("entity_equipment",{
                entityId:player.entity.id,
                slot:4,
                item:packet.item
            });
    if (packet.slot==6)
            player._writeOthers("entity_equipment",{
                entityId:player.entity.id,
                slot:3,
                item:packet.item
            });
    if (packet.slot==7)
            player._writeOthers("entity_equipment",{
                entityId:player.entity.id,
                slot:2,
                item:packet.item
            });
    if (packet.slot==8)
            player._writeOthers("entity_equipment",{
                entityId:player.entity.id,
                slot:1,
                item:packet.item
            });

  });
}
