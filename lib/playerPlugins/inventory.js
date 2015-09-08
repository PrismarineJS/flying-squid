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
  });
  
  player._client.on("set_creative_slot", function (packet) {
    inventory[packet.slot]=packet.item;
  });

  player.heldItem = heldItem;
  player.heldItemSlot = heldItemSlot;
  player.inventory = inventory;
}
