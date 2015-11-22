module.exports.player=function(player)
{
  player.heldItemSlot=0;
  player.heldItem=0;
  player.inventory = new Inventory(4, 9)
  player.armor = new Inventory(4, 1)
  player.craftingArea = new Inventory(2, 2)
  player.craftingOutput = new Inventory(1, 1)
  
  player._client.on("held_item_slot", ({slotId} = {}) => {
    player.heldItemSlot = slotId;
    player.heldItem = player.inventory.getSlot(3, player.heldItemSlot);
    player._writeOthersNearby("entity_equipment",{
        entityId:player.id,
        slot:0,
        item:player.heldItem
    });
  });
  
  player._client.on("set_creative_slot", ({slot,item} ={}) => {
    player.inventory.setSlot( (slot - (slot % 9)) / 9 , slot % 9  , item);
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

function Inventory(Rows, Columns){
  this._inventory = []
  this.rows = Rows
  this.columns = Columns
   
  this.getSlot = function(Row, Column){
   return this._inventory[Row][Column]
  }
  this.setSlot = function(Row, Column, Item){
    this._inventory[Row][Column] = Item
  }
  this.inventoryAsArray = function(){
    return this._inventory
  }
    
  for(var i = 0; i < Rows; i++){
    this._inventory.push([])
      for(var j = 0; j < Columns; j++){
        // SHOVELS FOR ALL!
        this._inventory[i].push(new ItemStack(new Item(256), 1))
      }
  }
}

function ItemStack(ItemType, StackSize){
  this.itemType = ItemType
  this.stackSize = StackSize
    
  this.isEmpty = function(){
    return this.stackSize == 0 ? true : false
  }
    
  this.take = function(NewStackSize){
    if(NewStackSize >= this.stackSize){
      var NewStack = new ItemStack(this.itemType, this.stackSize)
      this.stackSize = 0
      return NewStack
    }else{
      var NewStack = new ItemStack(this.itemType, NewStackSize)
      this.stackSize -= NewStackSize
      return NewStack
    }
  }
}


// 1.8 is fine, right?

var MinecraftData = require("minecraft-data")("1.8")

var IdToItem = {}
var NameToItem = {}

for(var ItemPlace in MinecraftData.items){
    var CurrentItem = MinecraftData.items[ItemPlace]
    IdToItem[Number(CurrentItem.id)] = CurrentItem
    NameToItem[CurrentItem.name] = CurrentItem
}

function Item(ItemIdOrName){
  var ItemInfo = IdToItem[ItemIdOrName] ? IdToItem[ItemIdOrName] : NameToItem[ItemIdOrName]
    
  this.id = ItemInfo.id
  this.name = ItemInfo.name
  this.displayName = ItemInfo.displayName
}