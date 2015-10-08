var vec3 = require("vec3");

module.exports=inject;

function toFixedPosition(p)
{
  return p.scaled(32);
}

function inject(serv,player)
{
  player._client.on('look', function(packet) {
    sendLook(packet.yaw,packet.pitch,packet.onGround)
  });

  // float (degrees) --> byte (1/256 "degrees")
  function conv(f){
    var b = (f % 360) * 256 / 360;
    if (b < -128) b += 256;
    else if (b > 127) b -= 256;
    return Math.floor(b);
  }
  function sendLook(yaw,pitch,onGround)
  {
    var convYaw=conv(yaw);
    var convPitch=conv(pitch);
    if (convYaw == player.entity.yaw && convPitch == player.entity.pitch) return;
    player._writeOthers("entity_look", {
      entityId: player.entity.id,
      yaw: convYaw,
      pitch: convPitch,
      onGround: onGround
    });
    player.entity.yaw = convYaw;
    player.entity.pitch = convPitch;
    player.entity.onGround = onGround;
    player._writeOthers("entity_head_rotation", {
      entityId: player.entity.id,
      headYaw: convYaw
    });
  }

  player._client.on('position', function (packet) {
    var position = new vec3(packet.x, packet.y, packet.z);
    var onGround = packet.onGround;
    sendRelativePositionChange(toFixedPosition(position), onGround);
  });

  player._client.on('position_look', function (packet) {
    var position = new vec3(packet.x, packet.y, packet.z);
    var onGround = packet.onGround;
    sendRelativePositionChange(toFixedPosition(position), onGround);
    sendLook(packet.yaw,packet.pitch,packet.onGround);
  });

  function sendRelativePositionChange(newPosition, onGround) {
    if (player.entity.position.distanceTo(new vec3(0, 0, 0)) != 0) {
      var diff = newPosition.minus(player.entity.position);
      if(diff.abs().x>127 || diff.abs().y>127 || diff.abs().z>127)
      {
        player._writeOthers('entity_teleport', {
          entityId:player.entity.id,
          x: newPosition.x,
          y: newPosition.y,
          z: newPosition.z,
          yaw: player.entity.yaw,
          pitch: player.entity.pitch,
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
    player.emit("positionChanged");
  }
}