const Vec3 = require('vec3').Vec3

module.exports.player = function (player) {
  player._client.on('look', ({ yaw, pitch, onGround } = {}) => sendLook(yaw, pitch, onGround))

  // float (degrees) --> byte (1/256 "degrees")
  function conv (f) {
    let b = Math.floor((f % 360) * 256 / 360)
    if (b < -128) b += 256
    else if (b > 127) b -= 256
    return b
  }
  function sendLook (yaw, pitch, onGround) {
    player.behavior('look', {
      yaw: yaw,
      pitch: pitch,
      onGround: onGround
    }, () => {
      const convYaw = conv(yaw)
      const convPitch = conv(pitch)
      if (convYaw === player.yaw && convPitch === player.pitch) return
      player._writeOthersNearby('entity_look', {
        entityId: player.id,
        yaw: convYaw,
        pitch: convPitch,
        onGround: onGround
      })
      player.yaw = convYaw
      player.pitch = convPitch
      player.onGround = onGround
      player._writeOthersNearby('entity_head_rotation', {
        entityId: player.id,
        headYaw: convYaw
      })
    }, () => {
      player.sendSelfPosition()
    })
  }

  player._client.on('position', ({ x, y, z, onGround } = {}) => {
    player.sendPosition((new Vec3(x, y, z)), onGround)
  })

  player._client.on('position_look', ({ x, y, z, onGround, yaw, pitch } = {}) => {
    player.sendPosition((new Vec3(x, y, z)), onGround)
    sendLook(yaw, pitch, onGround)
  })

  player.sendSelfPosition = () => {
    // double position in all versions
    player._client.write('position', {
      x: player.position.x,
      y: player.position.y,
      z: player.position.z,
      yaw: player.yaw,
      pitch: player.pitch,
      flags: 0x00,
      teleportId: 1
    })
  }

  player.teleport = async (position) => {
    const notCancelled = await player.sendPosition(position, false, true)
    if (notCancelled) player.sendSelfPosition()
  }

  player.sendAbilities = () => { // FIXME
    // const godmode = player.gameMode === 1 || player.gameMode === 3
    // const canFly = player.gameMode === 1 || player.gameMode === 3
    // const isFlying = !player.onGround && canFly
    // const creativeMode = player.gameMode === 1
    // const f = (+godmode * 8) + (+canFly * 4) + (+isFlying * 2) + (+creativeMode)
    // const walkingSpeed = 0.2 * (1 + (player.effects[1] !== null ? (player.effects[1].amplifier + 1) : 0) * 0.2)
    // const flyingSpeed = 0.1
    // console.log(walkingSpeed, flyingSpeed);
    // player._client.write('abilities', { // XXX
    //   flags: f,
    //   walkingSpeed: walkingSpeed,
    //   flyingSpeed: flyingSpeed
    // });
  }
}

module.exports.entity = function (entity, serv) {
  entity.sendPosition = (position, onGround, teleport = false) => {
    if (typeof position === 'undefined') throw new Error('undef')
    if (entity.position.equals(position) && entity.onGround === onGround) return Promise.resolve()
    return entity.behavior('move', {
      position: position,
      onGround: onGround,
      teleport: teleport
    }, ({ position, onGround }) => {
      // known position is very important because the diff (/delta) send to players is floored hence is not precise enough
      // storing the known position allows to compensate next time a diff is sent
      // without the known position, the error accumulate fast and player position is incorrect from the point of view
      // of other players
      entity.knownPosition = entity.knownPosition === undefined ? entity.position : entity.knownPosition

      const diff = position.minus(entity.knownPosition)

      let maxDelta
      if (serv.supportFeature('fixedPointDelta')) {
        maxDelta = 3
      } else if (serv.supportFeature('fixedPointDelta128')) {
        maxDelta = 7
      }

      if (diff.abs().x > maxDelta || diff.abs().y > maxDelta || diff.abs().z > maxDelta) {
        let entityPosition

        if (serv.supportFeature('fixedPointPosition')) {
          entityPosition = position.scaled(32).floored()
        } else if (serv.supportFeature('doublePosition')) {
          entityPosition = position
        }
        entity._writeOthersNearby('entity_teleport', {
          entityId: entity.id,
          x: entityPosition.x,
          y: entityPosition.y,
          z: entityPosition.z,
          yaw: entity.yaw,
          pitch: entity.pitch,
          onGround: onGround
        })
        entity.knownPosition = position
      } else if (diff.distanceTo(new Vec3(0, 0, 0)) !== 0) {
        let delta
        if (serv.supportFeature('fixedPointDelta')) {
          delta = diff.scaled(32).floored()
          entity.knownPosition = entity.knownPosition.plus(delta.scaled(1 / 32))
        } else if (serv.supportFeature('fixedPointDelta128')) {
          delta = diff.scaled(32).scaled(128).floored()
          entity.knownPosition = entity.knownPosition.plus(delta.scaled(1 / 32 / 128))
        }
        entity._writeOthersNearby('rel_entity_move', {
          entityId: entity.id,
          dX: delta.x,
          dY: delta.y,
          dZ: delta.z,
          onGround: onGround
        })
      }

      entity.position = position
      entity.onGround = onGround
    }, () => {
      if (entity.type === 'player') entity.sendSelfPosition()
    })
  }

  entity.teleport = (pos) => { // Overwritten in players inject above
    entity.sendPosition(pos, false, true)
  }
}
