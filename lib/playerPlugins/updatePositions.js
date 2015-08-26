var vec3 = require("vec3");

module.exports=inject;

function toFixedPosition(p)
{
  return new vec3(Math.floor(p.x*32),Math.floor(p.y*32),Math.floor(p.z*32))
}

function inject(serv,player)
{
  player._client.on('position', function (packet) {
    var position = new vec3(packet.x, packet.y, packet.z);
    var onGround = packet.onGround;
    sendRelativePositionChange(toFixedPosition(position), onGround);
  });

  player._client.on('position_look', function (packet) {
    var position = new vec3(packet.x, packet.y, packet.z);
    var onGround = packet.onGround;
    sendRelativePositionChange(toFixedPosition(position), onGround);
  });

  function sendRelativePositionChange(newPosition, onGround) {
    if (player.entity.position.distanceTo(new vec3(0, 0, 0)) != 0) {
      var diff = newPosition.minus(player.entity.position);
      if(diff.abs().x>256 || diff.abs().y>256 || diff.abs().z>256)
      {
        player._client.write('entity_teleport', {
          entityId:player.entity.id,
          x: newPosition.x,
          y: newPosition.y,
          z: newPosition.z,
          yaw: 0,
          pitch: 0,
          onGround: onGround
        });
      }
      else if (diff.distanceTo(new vec3(0, 0, 0)) != 0) {
        player._writeOthers('rel_entity_move', {
          entityId: player.entity.id,
          dX: diff.x,
          dY: diff.y,
          dZ: diff.z,
          onGround: onGround
        });
      }
    }
    player.entity.position = newPosition;
    player.entity.onGround = onGround;
  }
}