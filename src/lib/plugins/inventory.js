var Windows = require("prismarine-windows")("1.8").windows
var ItemStack = require("prismarine-item")("1.8")

module.exports.player=function(player)
{
  player.heldItemSlot = 0
  player.heldItem = new ItemStack(256, 1)
  player.inventory = new Windows.InventoryWindow(0, "???", 44)
  
  player._client.on("held_item_slot", ({slotId} = {}) => {
    player.heldItemSlot = slotId;
    
    player.heldItem = player.inventory.itemsRange(36 + player.heldItemSlot, 36 + player.heldItemSlot + 1)
    player._writeOthersNearby("entity_equipment",{
        entityId: player.id,
        slot: 0,
        item: ItemStack.toNotch(player.heldItem)
    });
  });
  
  player._client.on("set_creative_slot", ({slot,item} ={}) => {
    if(item.blockId == -1){
      player.inventory.updateSlot(slot, undefined)
      player.emit("inventoryChange")
      return;
    }
    player.inventory.updateSlot(slot, new ItemStack(item.blockId, item.itemCount, item.metadata))
    player.emit("inventoryChange")
    
    if (slot==36)
      player._writeOthersNearby("entity_equipment",{
        entityId:player.id,
        slot:0,
        item:item
      });
    if (slot==5)
            player._writeOthersNearby("entity_equipment",{
                entityId:player.id,
                slot:4,
                item:item
            });
    if (slot==6)
            player._writeOthersNearby("entity_equipment",{
                entityId:player.id,
                slot:3,
                item:item
            });
    if (slot==7)
            player._writeOthersNearby("entity_equipment",{
                entityId:player.id,
                slot:2,
                item:item
            });
    if (slot==8)
            player._writeOthersNearby("entity_equipment",{
                entityId:player.id,
                slot:1,
                item:item
            });

  });
};
