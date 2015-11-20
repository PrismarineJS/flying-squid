var Vec3 = require("vec3").Vec3;

Vec3.prototype.toFixedPosition=function() {
  return this.scaled(32).floored();
};

module.exports.player=function(player)
{
  player._client.on('look', ({yaw,pitch,onGround} = {}) => sendLook(yaw,pitch,onGround));

  // float (degrees) --> byte (1/256 "degrees")
  function conv(f){
    var b = Math.floor((f % 360) * 256 / 360);
    if (b < -128) b += 256;
    else if (b > 127) b -= 256;
    return b;
  }
  function sendLook(yaw,pitch,onGround)
  {
    var convYaw=conv(yaw);
    var convPitch=conv(pitch);
    if (convYaw == player.yaw && convPitch == player.pitch) return;
    player._writeOthersNearby("entity_look", {
      entityId: player.id,
      yaw: convYaw,
      pitch: convPitch,
      onGround: onGround
    });
    player.yaw = convYaw;
    player.pitch = convPitch;
    player.onGround = onGround;
    player._writeOthersNearby("entity_head_rotation", {
      entityId: player.id,
      headYaw: convYaw
    });
  }

  player._client.on('position', ({x,y,z,onGround} = {}) =>
    sendRelativePositionChange((new Vec3(x, y, z)).toFixedPosition(), onGround));

  player._client.on('position_look', ({x,y,z,onGround,yaw,pitch} = {}) => {
    sendRelativePositionChange((new Vec3(x, y, z)).toFixedPosition(), onGround);
    sendLook(yaw,pitch,onGround);
  });

  function sendRelativePositionChange(newPosition, onGround) {
    if (player.position.distanceTo(new Vec3(0, 0, 0)) != 0) {
      var diff = newPosition.minus(player.position);
      if(diff.abs().x>127 || diff.abs().y>127 || diff.abs().z>127)
      {
        player._writeOthersNearby('entity_teleport', {
          entityId:player.id,
          x: newPosition.x,
          y: newPosition.y,
          z: newPosition.z,
          yaw: player.yaw,
          pitch: player.pitch,
          onGround: onGround
        });
      }
      else if (diff.distanceTo(new Vec3(0, 0, 0)) != 0) {
        player._writeOthersNearby('rel_entity_move', {
          entityId: player.id,
          dX: diff.x,
          dY: diff.y,
          dZ: diff.z,
          onGround: onGround
        });
      }
    }
    player.position = newPosition;
    player.onGround = onGround;
    player.emit("positionChanged");
  }

  player.sendPosition = () => {
    player._client.write('position', {
      x: player.position.x/32,
      y: player.position.y/32,
      z: player.position.z/32,
      yaw: player.yaw,
      pitch: player.pitch,
      flags: 0x00
    });
  };
};

module.exports.entity=function(entity,serv){
  entity.sendPosition = ({oldPos,onGround}) => {
    var diff = entity.position.minus(oldPos);

    if(diff.abs().x>127 || diff.abs().y>127 || diff.abs().z>127)
      entity._writeOthersNearby('entity_teleport', {
        entityId: entity.id,
        x: entity.position.x,
        y: entity.position.y,
        z: entity.position.z,
        yaw: entity.yaw,
        pitch: entity.pitch,
        onGround: onGround
      });
    else if (diff.distanceTo(new Vec3(0, 0, 0)) != 0) serv._writeNearby('rel_entity_move', {
      entityId: entity.id,
      dX: diff.x,
      dY: diff.y,
      dZ: diff.z,
      onGround: onGround
    }, entity);

    entity.emit('positionChanged', oldPos);
  };
};