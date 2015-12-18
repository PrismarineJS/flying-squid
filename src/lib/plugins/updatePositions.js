const Vec3 = require("vec3").Vec3;

Vec3.prototype.toFixedPosition=function() {
  return this.scaled(32).floored();
};

module.exports.player=function(player)
{
  player._client.on('look', ({yaw,pitch,onGround} = {}) => sendLook(yaw,pitch,onGround));

  // float (degrees) --> byte (1/256 "degrees")
  function conv(f){
    let b = Math.floor((f % 360) * 256 / 360);
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
      const convYaw=conv(yaw);
      const convPitch=conv(pitch);
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
    const notCancelled = await player.sendPosition(position.scaled(32).floored(), false, true);
    if (notCancelled) player.sendSelfPosition();
  };

  player.sendAbilities = () => { // TODO: Fix all of this...
    const godmode = player.gameMode == 1 || player.gameMode == 3;
    const canFly = player.gameMode == 1 || player.gameMode == 3;
    const isFlying = !player.onGround && canFly;
    const creativeMode = player.gameMode == 1;
    const f = (+godmode*8) + (+canFly*4) + (+isFlying*2) + (+creativeMode);
    const walkingSpeed = 0.2 * (1 + (player.effects[1] != null ? (player.effects[1].amplifier + 1) : 0) * 0.2);
    const flyingSpeed = 0.1;
    /*console.log(walkingSpeed, flyingSpeed);
    player._client.write('abilities', { // FIIIIXXXXXXX
      flags: f,
      walkingSpeed: walkingSpeed,
      flyingSpeed: flyingSpeed
    });*/ 
  }
};

module.exports.entity=function(entity){
  entity.sendPosition = (position, onGround, teleport=false) => {
    if (typeof position == 'undefined') throw new Error('undef');
    if (entity.position.equals(position) && entity.onGround == onGround) return Promise.resolve();
    return entity.behavior('move', {
      position: position,
      onGround: onGround,
      teleport: teleport
    }, ({position,onGround}) => {
      const diff = position.minus(entity.position);
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

  entity.teleport = (pos) => { // Overwritten in players inject above
    entity.sendPosition(pos.scaled(32), false, true);
  }
};
