var vec3 = require("vec3");

module.exports = inject;

function inject(serv) {
  serv.on('tick', function(delta) {
    Promise.all(
      Object.keys(serv.entities).map(async (id) => {
        var entity = serv.entities[id];
        if (!entity.velocity || !entity.size) return;
        if (entity.gravity) {
          addGravity(entity, 'x', delta);
          addGravity(entity, 'y', delta);
          addGravity(entity, 'z', delta);
        }

        var vSign = getSign(entity.velocity);
        var sizeSigned = vec3(vSign.x * entity.size.x, vSign.y * entity.size.y, vSign.z * entity.size.z);

        var xVec = entity.position.offset(entity.velocity.x*delta + sizeSigned.x/2, 0, 0).scaled(1/32).floored();
        var yVec = entity.position.offset(0, entity.velocity.y*delta + sizeSigned.y/2, 0).scaled(1/32).floored();
        var zVec = entity.position.offset(0, 0, entity.velocity.z*delta + sizeSigned.z/2).scaled(1/32).floored();

        //console.log(xVec, yVec, zVec);
        //console.log(entity.velocity);

        // Get block for each (x/y/z)Vec, check to avoid duplicate getBlockTypes
        var xBlock = (await entity.world.getBlockType(xVec)) != 0;
        var yBlock = yVec.equals(xVec) ? xBlock : (await entity.world.getBlockType(yVec)) != 0;
        var zBlock = zVec.equals(yVec) ? yBlock : (zVec.equals(xVec) ? xBlock : (await entity.world.getBlockType(zVec)) != 0);

        var old = entity.position.clone();

        if (xBlock || yBlock || zBlock) {
          entity.velocity.x = getFriction(entity.velocity.x, entity.friction.x, delta);
          entity.velocity.z = getFriction(entity.velocity.x, entity.friction.x, delta);
        }

        //console.log('afterfric',entity.velocity);

        entity.position.x += getMoveAmount('x', xBlock, entity, delta, sizeSigned.x);
        entity.position.y += getMoveAmount('y', yBlock, entity, delta, sizeSigned.y);
        entity.position.z += getMoveAmount('z', zBlock, entity, delta, sizeSigned.z);

        //console.log(entity.position, old);

        serv.emitParticle(23, serv.overworld, entity.position.scaled(1/32), { size: vec3(0, 0, 0) });
      })
    ).catch((err)=> setTimeout(() => {throw err;},0));
  });
  
  serv.destroyEntity = entity => {
    console.log('Destroying');
    serv._writeNearby('entity_destroy', {
      entityIds: [entity.id]
    }, entity.position);
    delete serv.entities[entity.id];
  }
}

function getMoveAmount(dir, block, entity, delta, sizeSigned) {
  if (block) {
    entity.velocity[dir] = 0;
    return Math.floor(-1 * (entity.position[dir] + sizeSigned/2 - floorInDirection(entity.position[dir], -sizeSigned)));
  } else {
    return Math.floor(entity.velocity[dir] * delta);
  }
}

function getSign(vec) {
  return vec3(Math.sign(vec.x), Math.sign(vec.y), Math.sign(vec.z));
}

function floorInDirection(a, b) {
  return b < 0 ? Math.floor(a) : Math.ceil(a);
}

function addGravity(entity, dir, delta) {
  if (entity.velocity[dir] < entity.terminalvelocity[dir] && entity.velocity[dir] > -entity.terminalvelocity[dir]) {
    entity.velocity[dir] = clamp(-entity.terminalvelocity[dir], entity.velocity[dir] + entity.gravity[dir] * delta, entity.terminalvelocity[dir]);
  }
}

function getFriction(vel, fric, delta) {
  return vel > 0 ? Math.max(0, vel - fric*delta) : Math.min(0, vel + fric*delta);
}

function clamp(a, b, c) {
  return Math.max(a, Math.min(b, c));
}