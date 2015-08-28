var vec3 = require("vec3");

module.exports=inject;

function toFixedPosition(p)
{
  return new vec3(Math.floor(p.x*32),Math.floor(p.y*32),Math.floor(p.z*32))
}

function inject(serv,player)
{
  // float (degrees) --> byte (1/256 "degrees")
  player._client.on('look', function(packet) {
    if(!packet.onGround) console.log("look thinks " + player.entity.id + " is a worm");
    sendLook(packet.yaw,packet.pitch,packet.onGround)
  });

  function conv(f){
    return (((Math.floor(f) % 360) / 360) * 256) & 0xFF;
  }
  function sendLook(yaw,pitch,onGround)
  {
    if(yaw==player.entity.yaw && pitch==player.entity.pitch) return;
    var c={
      entityId:player._client.id,
      yaw:conv(yaw),
      pitch:conv(pitch),
      onGround:onGround
    };
    console.log(yaw);
    console.log(pitch);
    console.log(c);
    player._writeOthers("entity_look", c);
    player.entity.yaw=conv(yaw);
    player.entity.pitch=conv(pitch);
    player.entity.onGround=onGround;
    player._writeOthers("entity_head_rotation", {
      entityId: player.entity.id,
      headYaw: conv(yaw)
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
    if(!onGround) console.log("position_look thinks "+player.entity.id+" is a worm");
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
  }
}