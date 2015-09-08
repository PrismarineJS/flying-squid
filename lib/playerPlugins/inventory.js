module.exports=inject;

function inject(serv, player)
{
  heldItemSlot=0;
  player._client.on("held_item_slot", function (packet) {
    heldItemSlot = packet.slotId;
  });

  player.heldItemSlot = heldItemSlot;
}
