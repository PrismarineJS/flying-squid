module.exports=inject;

function inject(serv, player) 
{
  player._client.on("arm_animation", function(packet) {
    player._writeOthers("animation", {
      entityId: player.entity.id,
      animation: 0
    });
  });

  function setMetadata(metadata)
  {
    player.entity.metadata = metadata;
    player._writeOthers("entity_metadata", {
      entityId: player.entity.id,
      metadata: player.entity.metadata
    });
  }

  player._client.on("entity_action", function(packet) {
    if(packet.actionId == 3)
      setMetadata([{"key":0,"type":0,"value": 0x08}]);
    if(packet.actionId == 4)
      setMetadata([{"key":0,"type":0,"value": 0x00}]);
    if(packet.actionId == 0)
      setMetadata([{"key":0,"type":0,"value": 0x02}]);
    if(packet.actionId == 1)
      setMetadata([{"key":0,"type":0,"value": 0x00}]);
  });
}