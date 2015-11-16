module.exports.player=function(player)
{
  player.heldItemSlot=0;
  player.heldItem=0;
  player.inventory=new Array(44);
  
  player._client.on("held_item_slot", ({slotId} = {}) => {
    player.heldItemSlot = slotId;
    if(player.inventory[36+player.heldItemSlot]===undefined){
      player.inventory[36+player.heldItemSlot]={
            blockId:-1
        };
    }
    player.heldItem = player.inventory[36+player.heldItemSlot];
    player._writeOthersNearby("entity_equipment",{
        entityId:player.entity.id,
        slot:0,
        item:player.heldItem
    });
  });
  
  player._client.on("set_creative_slot", ({slot,item} ={}) => {
    player.inventory[slot]=item;
    if (slot==36)
      player._writeOthersNearby("entity_equipment",{
        entityId:player.entity.id,
        slot:0,
        item:item
      });
    if (slot==5)
            player._writeOthersNearby("entity_equipment",{
                entityId:player.entity.id,
                slot:4,
                item:item
            });
    if (slot==6)
            player._writeOthersNearby("entity_equipment",{
                entityId:player.entity.id,
                slot:3,
                item:item
            });
    if (slot==7)
            player._writeOthersNearby("entity_equipment",{
                entityId:player.entity.id,
                slot:2,
                item:item
            });
    if (slot==8)
            player._writeOthersNearby("entity_equipment",{
                entityId:player.entity.id,
                slot:1,
                item:item
            });

  });
};
