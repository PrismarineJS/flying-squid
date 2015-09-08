module.exports=inject;

function inject(serv, player)
{
  heldItemSlot=0;
  inventory=new Array(54);
  
  player._client.on("held_item_slot", function (packet) {
    heldItemSlot = packet.slotId;
  });
  player._client.on("set_creative_slot", function (packet) {
    inventory[packet.slot]=packet.item;
  });

  player.heldItemSlot = heldItemSlot;
  player.inventory = inventory;
}
