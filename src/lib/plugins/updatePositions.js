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
      player.sendSelfPosition();
    });
  }

  player._client.on('position', ({x,y,z,onGround} = {}) => {
    player.sendPosition((new Vec3(x, y, z)).toFixedPosition(), onGround);
  });

  player._client.on('position_look', ({x,y,z,onGround,yaw,pitch} = {}) => {
    player.sendPosition((new Vec3(x, y, z)).toFixedPosition(), onGround);
    sendLook(yaw,pitch,onGround);
  });

  player.sendSelfPosition = () => {
    player._client.write('position', {
      x: player.position.x/32,
      y: player.position.y/32,
      z: player.position.z/32,
      yaw: player.yaw,
      pitch: player.pitch,
      flags: 0x00
    });
  };

  player.teleport = async (position) => {
    var notCancelled = await player.sendPosition(position.scaled(32).floored(), false, true);
    if (notCancelled) player.sendSelfPosition();
  }

  player.sendAbilities = () => {
    var f = (+(player.gameMode == 1)*1) + (+(player.gameMode == 1 || player.gameMode == 3)*2) + (+(player.gameMode == 1 || player.gamemode == 3)*4);
    var walkingSpeed = 1.0 + ((player.effects[1] != null ? (player.effects[1].amplifier + 1) : 0) * 0.2)
    var flyingSpeed = 0.2;
    console.log(walkingSpeed, flyingSpeed);
    player._client.write('abilities', {
      flags: f,
      walkingSpeed: walkingSpeed,
      flyingSpeed: flyingSpeed
    });
  }
};

module.exports.entity=function(entity,serv){
  entity.sendPosition = (position, onGround, teleport=false) => {
    if (typeof position == 'undefined') throw new Error('undef');
    if (entity.position.equals(position) && entity.onGround == onGround) return Promise.resolve();
    return entity.behavior('move', {
      position: position,
      onGround: onGround,
      teleport: teleport
    }, ({position,onGround}) => {
      var diff = position.minus(entity.position);
      if(diff.abs().x>127 || diff.abs().y>127 || diff.abs().z>127)
        entity._writeOthersNearby('entity_teleport', {
          entityId: entity.id,
          x: position.x,
          y: position.y,
          z: position.z,
          yaw: entity.yaw,
          pitch: entity.pitch,
          onGround: onGround
        });
      else if (diff.distanceTo(new Vec3(0, 0, 0)) != 0) entity._writeOthersNearby('rel_entity_move', {
        entityId: entity.id,
        dX: diff.x,
        dY: diff.y,
        dZ: diff.z,
        onGround: onGround
      });

      entity.position = position;
      entity.onGround = onGround;
    }, () => {
      if (entity.type == 'player') player.sendSelfPosition();
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

  entity.teleport = (pos) => { // Overwritten in players inject above
    entity.sendPosition(pos.scaled(32), false, true);
  }

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
