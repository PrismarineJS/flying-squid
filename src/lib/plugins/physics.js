const Vec3 = require('vec3').Vec3

module.exports.entity = function (entity, serv, { version }) {
  const blocks = require('minecraft-data')(version).blocks

  entity.calculatePhysics = async (delta) => {
    if (entity.gravity) {
      addGravity(entity, 'x', delta)
      addGravity(entity, 'y', delta)
      addGravity(entity, 'z', delta)
    }

    const vSign = getSign(entity.velocity)
    const sizeSigned = new Vec3(vSign.x * entity.size.x, vSign.y * entity.size.y, vSign.z * entity.size.z)

    const xVec = entity.position.offset(entity.velocity.x * delta + sizeSigned.x / 2, 0, 0)
    const yVec = entity.position.offset(0, entity.velocity.y * delta + sizeSigned.y / 2, 0)
    const zVec = entity.position.offset(0, 0, entity.velocity.z * delta + sizeSigned.z / 2)

    // Get block for each (x/y/z)Vec, check to avoid duplicate getBlockTypes
    const xBlock = blocks[await entity.world.getBlockType(xVec)].boundingBox === 'block'
    const yBlock = yVec.equals(xVec) ? xBlock : blocks[await entity.world.getBlockType(yVec)].boundingBox === 'block'
    const zBlock = zVec.equals(yVec) ? yBlock : (zVec.equals(xVec) ? xBlock : blocks[await entity.world.getBlockType(zVec)].boundingBox === 'block')

    if (xBlock || yBlock || zBlock) {
      entity.velocity.x = getFriction(entity.velocity.x, entity.friction.x, delta)
      entity.velocity.z = getFriction(entity.velocity.z, entity.friction.z, delta)
    }

    const newPos = entity.position.clone()

    newPos.x += getMoveAmount('x', xBlock, entity, delta, sizeSigned.x)
    newPos.y += getMoveAmount('y', yBlock, entity, delta, sizeSigned.y)
    newPos.z += getMoveAmount('z', zBlock, entity, delta, sizeSigned.z)

    // serv.emitParticle(30, serv.overworld, entity.position, { size: new Vec3(0, 0, 0) });
    return { position: newPos, onGround: yBlock }
  }

  entity.sendVelocity = (vel, maxVel) => {
    const velocity = vel
    const maxVelocity = maxVel
    let scaledVelocity = velocity.scaled(8000 / 20) // from fixed-position/second to unit => 1/8000 blocks per tick
    if (serv.supportFeature('fixedPointPosition')) {
      scaledVelocity = scaledVelocity.scaled(1 / 32)
    }
    scaledVelocity = scaledVelocity.floored()
    entity._writeNearby('entity_velocity', {
      entityId: entity.id,
      velocityX: scaledVelocity.x,
      velocityY: scaledVelocity.y,
      velocityZ: scaledVelocity.z
    })
    if (entity.type !== 'player') {
      if (maxVelocity) entity.velocity = addVelocityWithMax(entity.velocity, velocity, maxVelocity)
      else entity.velocity.add(velocity)
    }
  }

  function getMoveAmount (dir, block, entity, delta, sizeSigned) {
    if (block) {
      entity.velocity[dir] = 0
      return -1 * (entity.position[dir] + sizeSigned / 2 - entity.position[dir])
    } else {
      return entity.velocity[dir] * delta
    }
  }

  function getSign (vec) {
    return new Vec3(Math.sign(vec.x), Math.sign(vec.y), Math.sign(vec.z))
  }

  function addGravity (entity, dir, delta) {
    if (entity.velocity[dir] < entity.terminalvelocity[dir] && entity.velocity[dir] > -entity.terminalvelocity[dir]) {
      entity.velocity[dir] = clamp(-entity.terminalvelocity[dir], entity.velocity[dir] + entity.gravity[dir] * delta, entity.terminalvelocity[dir])
    }
  }

  function getFriction (vel, fric, delta) {
    return vel > 0 ? Math.max(0, vel - fric * delta) : Math.min(0, vel + fric * delta)
  }

  function clamp (a, b, c) {
    return Math.max(a, Math.min(b, c))
  }

  function addVelocityWithMax (current, newVel, max) {
    let x, y, z
    if (current.x > max.x || current.x < -max.x) x = current.x
    else x = Math.max(-max.x, Math.min(max.x, current.x + newVel.x))
    if (current.y > max.y || current.y < -max.y) y = current.y
    else y = Math.max(-max.y, Math.min(max.y, current.y + newVel.y))
    if (current.z > max.z || current.z < -max.z) z = current.z
    else z = Math.max(-max.z, Math.min(max.z, current.z + newVel.z))
    return new Vec3(x, y, z)
  }
}

module.exports.server = function (serv) {
  serv.commands.add({
    base: 'velocity',
    info: 'Push velocity on player(s)',
    usage: '/velocity <player> <x> <y> <z>',
    op: true,
    parse (str) {
      return str.match(/(.+?) (\d+) (\d+) (\d+)/) || false
    },
    action (params, ctx) {
      const selector = ctx.player ? ctx.player.selectorString(params[1]) : serv.selectorString(params[1])
      const parsedInt = [parseInt(params[2]), parseInt(params[3]), parseInt(params[4])]
      for (const int of parsedInt) {
        if (int > 81) return 'Too much velocity, max is 81.'
      }
      const vec = new Vec3(parsedInt[0], parsedInt[1], parsedInt[2])
      selector.forEach(e => e.sendVelocity(vec, vec.scaled(5)))
    }
  })
}
