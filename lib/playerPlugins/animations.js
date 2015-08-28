module.exports=inject;

function inject(serv, player) 
{
  player._client.on("arm_animation", function(packet) {
    player._writeOthers("animation", {
      entityId: player.entity.id,
      animation: 0
    });
  });

  player._client.on("entity_action", function(packet) {
    if(packet.actionId == 3) {
      player.entity.metadata = [{"key":0,"type":"byte","value": 0x08}];
      player._writeOthers("entity_metadata", {
        entityId: player.entity.id,
        metadata: player.entity.metadata
      });
    }

    if(packet.actionId == 4) {
      player.entity.metadata = [{"key":0,"type":"byte","value": 0x00}];
      player._writeOthers("entity_metadata", {
        entityId: player.entity.id,
        metadata: player.entity.metadata
      });
    }

    if(packet.actionId == 0) {
      player.entity.metadata = [{"key":0,"type":"byte","value": 0x02}];
      player._writeOthers("entity_metadata", {
        entityId: player.entity.id,
        metadata: player.entity.metadata
      });
    }

    if(packet.actionId == 1) {
      player.entity.metadata = [{"key":0,"type":"byte","value": 0x00}];
      player._writeOthers("entity_metadata", {
        entityId: player.entity.id,
        metadata: player.entity.metadata
      });
    }
  });
}