module.exports=inject;

function inject(serv, player)
{
  heldItemSlot=0;
  heldItem=0;
  inventory=new Array(44);
  
  player._client.on("held_item_slot", function (packet) {
    heldItemSlot = packet.slotId;
    if(inventory[36+heldItemSlot]===undefined){
        inventory[36+heldItemSlot]={
            blockId:-1
        };
    }
    heldItem = inventory[36+heldItemSlot];
    player._writeOthers("entity_equipment",{
        entityId:player.entity.id,
        slot:0,
        item:heldItem
    });
  });
  
  player._client.on("set_creative_slot", function (packet) {
    inventory[packet.slot]=packet.item;
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

  player.heldItem = heldItem;
  player.heldItemSlot = heldItemSlot;
  player.inventory = inventory;
}
