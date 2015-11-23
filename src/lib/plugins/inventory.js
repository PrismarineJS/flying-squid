var Version = require("../version")
var Windows = require("prismarine-windows")(Version).windows
var ItemStack = require("prismarine-item")(Version)

module.exports.player = function(player)
{
  player.heldItemSlot = 0
  player.heldItem = new ItemStack(256, 1)
  player.inventory = new Windows.InventoryWindow(0, "Inventory", 44)
  
  player._client.on("held_item_slot", ({slotId} = {}) => {
    player.heldItemSlot = slotId;
    player.heldItem = player.inventory.slots[36 + player.heldItemSlot]
    
    player._writeOthersNearby("entity_equipment",{
        entityId: player.id,
        slot: 0,
        item: ItemStack.toNotch(player.heldItem)
    });
  });
  
  player._client.on("window_click", function(clickInfo){
    // Let the inventory know of the click
    player.inventory.acceptClick(clickInfo)
    
    // Do other stuff the inventory doesn't do, eg spawn the dropped item
    switch(clickInfo.mode){
      case 0:
        if(clickInfo.button == 0){
          // Left mouse click
        }else{
          // Right mouse click
        }
      break;
      
      case 1:
        if(clickInfo.button == 0){
          // Shift + Left click
        }else{
          // Shift + right click
        }
      break;
      
      case 2:
        // button 0 -> 8, indication hotbar switching
      break
      
      case 3:
        // Middle click
      break;
      
      case 4:
        if(clickInfo.slot == -999){
          // Click with nothing outside window
        }else{
          if(clickInfo.button == 0){
            // Drop one item at slot
          }else{
            // Drop full stack at slot
          }
        }
      break;
      
      case 5:
        if(clickInfo.slot == -999){
          switch(clickInfo.button){
            case 0:
              // Start left mouse drag
            break;
            
            case 4:
              // Start right mouse drag
            break;
            
            case 2:
              // End left mouse drag
            break;
            
            case 6:
              // End right mouse drag
            break;
          }
        }else{
          switch(clickInfo.button){
            case 1:
              // Add slot for left mouse drag
            break;
            
            case 5:
              // Add slot for right mouse drag
            break;
          }
        }
      break;
      
      case 6:
        // Double click
      break;
    }
  })
  
  player._client.on("set_creative_slot", ({slot,item} ={}) => {
    if(item.blockId == -1){
      player.inventory.updateSlot(slot, undefined)
      return;
    }
    
    var newItem = new ItemStack(item.blockId, item.itemCount, item.metadata)
    player.inventory.updateSlot(slot, newItem)
    
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
    var items = player.inventory.slots
    
    for(var itemIndex in items){
      var item = items[itemIndex]
      player._client.write("set_slot", {
        windowId: 0,
        slot: itemIndex,
        item: ItemStack.toNotch(item)
      })
    }
  })
};
