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
    player.behavior('look', {
      yaw: yaw,
      pitch: pitch,
      onGround: onGround
    }, () => {
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
    }, () => {
      player.sendPosition();
    });
  }

  player._client.on('position', ({x,y,z,onGround} = {}) =>
    player.sendRelativePositionChange((new Vec3(x, y, z)).toFixedPosition(), onGround));

  player._client.on('position_look', ({x,y,z,onGround,yaw,pitch} = {}) => {
    player.sendRelativePositionChange((new Vec3(x, y, z)).toFixedPosition(), onGround);
    sendLook(yaw,pitch,onGround);
  });

  player.sendRelativePositionChange = (newPosition, onGround) => {
    player.behavior('move', {
      onGround: onGround,
      position: newPosition
    }, () => {
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
    }, () => {
      player.sendPosition();
    });
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

  player.teleport = (position) => {
    player.sendRelativePositionChange(position, false);
    player.sendPosition();
  }
};

module.exports.entity=function(entity,serv){
  entity.sendPosition = ({oldPos,onGround}) => {
    entity.behavior('move', {
      old: oldPos,
      onGround: onGround
    }, ({old,onGround}) => {
      var diff = entity.position.minus(old);

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
    }, () => {
      entity.position = oldPos;
    });
  };



  entity.sendVelocity = (vel, maxVel) => {
    var velocity = vel.scaled(32).floored(); // Make fixed point
    var maxVelocity = maxVel.scaled(32).floored();
    var scaledVelocity = velocity.scaled(8000/32/20).floored(); // from fixed-position/second to unit => 1/8000 blocks per tick
    entity._writeOthersNearby('entity_velocity', {
      entityId: entity.id,
      velocityX: scaledVelocity.x,
      velocityY: scaledVelocity.y,
      velocityZ: scaledVelocity.z
    });
    if (entity.type != 'player') {
      if (maxVelocity) entity.velocity = addVelocityWithMax(entity.velocity, velocity, maxVelocity);
      else entity.velocity.add(velocity);
    }
  };

  function addVelocityWithMax(current, newVel, max) {
    var x, y, z;
    if (current.x > max.x || current.x < -max.x) x = current.x;
    else x = Math.max(-max.x, Math.min(max.x, current.x + newVel.x));
    if (current.y > max.y || current.y < -max.y) y = current.y;
    else y = Math.max(-max.y, Math.min(max.y, current.y + newVel.y));
    if (current.z > max.z || current.z < -max.z) z = current.z;
    else z = Math.max(-max.z, Math.min(max.z, current.z + newVel.z));
    return new Vec3(x, y, z);
  }
};
