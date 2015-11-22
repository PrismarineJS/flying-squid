var Version = require("../version")
var Windows = require("prismarine-windows")(Version).windows
var ItemStack = require("prismarine-item")(Version)

module.exports.player=function(player)
{
  player.heldItemSlot = 0
  player.heldItem = new ItemStack(256, 1)
  player.inventory = new Windows.InventoryWindow(0, "Inventory", 44)
  
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
      return;
    }
    
    var NewItem = new ItemStack(item.blockId, item.itemCount, item.metadata)
    player.inventory.updateSlot(slot, NewItem)
    
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
  
  player.inventory.on("windowUpdate", function(){
    var Items = entity.inventory.slots
    
    for(var ItemIndex in Items){
      var Item = Items[ItemIndex]
      player._client.write("set_slot", {
        windowId: 0,
        slot: ItemIndex,
        item: ItemStack.toNotch(Item)
      })
    }
  })
};
