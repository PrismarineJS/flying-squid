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
    // Do other stuff the inventory doesn't do, eg spawn the dropped item.
    // I've left in stuff that inventory handles, because the cancelling hooks
    // might go here (?)
    switch(clickInfo.mode){
      case 0:
        if(clickInfo.mouseButton == 0){
          // Left mouse click
          // Inventory deals with this
        }else{
          // Right mouse click
          // Inventory deals with this
        }
      break;
      
      case 1:
        if(clickInfo.mouseButton == 0){
          // Shift + Left click
          // Inventory deals with this
        }else{
          // Shift + right click
          // Inventory deals with this
        }
      break;
      
      case 2:
        // button 0 -> 8, indication hotbar switching items
        // (Nothing to do with held_item_slot)
        // DANGER! crashes because windows.js hasn't implemented it yet.
        return;
      break
      
      case 3:
        // Middle click
        // DANGER! crashes because windows.js hasn't implemented it yet.
        return;
      break;
      
      case 4:
        if(clickInfo.slot == -999){
          // Click with nothing outside window. Do nothing.
        }else{
          // I'd love to implement this, but dropped entities are not finished.
          if(clickInfo.mouseButton == 0){
            // Drop one item at slot
            // Inventory handles removing one
          }else{
            // Drop full stack at slot
            // Inventory handles removing the whole stack
          }
        }
      break;
      
      // Inventory does not support dragging yet, so not implementing yet.
      case 5:
        if(clickInfo.slot == -999){
          switch(clickInfo.mouseButton){
            case 0:
              // Start left mouse drag
              return;
            break;
            
            case 4:
              // Start right mouse drag
              return;
            break;
            
            case 2:
              // End left mouse drag
              return;
            break;
            
            case 6:
              // End right mouse drag
              return;
            break;
          }
        }else{
          switch(clickInfo.mouseButton){
            case 1:
              // Add slot for left mouse drag
              return;
            break;
            
            case 5:
              // Add slot for right mouse drag
              return;
            break;
          }
        }
      break;
      
      // Inventory does not support double click yet, so not implementing yet.
      case 6:
        // Double click
        return;
      break;
    }
    
    // Let the inventory know of the click.
    // It's important to let it know of the click later, because it destroys
    // information we need about the inventory.
    player.inventory.acceptClick(clickInfo)
  })
  
  player._client.on("set_creative_slot", ({slot,item} ={}) => {
    if(item.blockId == -1){
      player.inventory.updateSlot(slot, undefined)
      return;
    }
    
    var newItem = new ItemStack(item.blockId, item.itemCount, item.metadata)
    player.inventory.updateSlot(slot, newItem)
    
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
    
    // Update held item
    player._writeOthersNearby("entity_equipment",{
      entityId: player.id,
      slot: 0,
      item: ItemStack.toNotch(player.heldItem)
    });
    
    // Update slots in inventory
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
