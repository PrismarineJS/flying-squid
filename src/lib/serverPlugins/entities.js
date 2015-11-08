var Entity=require("prismarine-entity");
var blocks=require("minecraft-data")(require("../version")).blocks;
var mobs=require("minecraft-data")(require("../version")).entitiesByName;
var vec3 = require("vec3");

module.exports = inject;

function inject(serv) {

  serv.initEntity = (type, entityType, world, position) => {
    serv.entityMaxId++;
    var entity = new Entity(serv.entityMaxId);
    console.log('Spawn entity',entity.id);
    entity.type = type;
    entity.entityType = entityType;
    entity.world = world;
    entity.position = position;

    entity.bornTime = Date.now();
    serv.entities[entity.id] = entity;

    entity.setMetadata = (data) => {
      serv._writeNearby('entity_metadata', {
        entityId: entity.id,
        metadata: data
      }, entity);
    }

    entity.destroy = () => {
      serv.destroyEntity(entity);
    }

    entity.calculatePhysics = async (delta) => {
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
      var xBlock = blocks[await entity.world.getBlockType(xVec)].boundingBox == 'block';
      var yBlock = yVec.equals(xVec) ? xBlock : blocks[await entity.world.getBlockType(yVec)].boundingBox == 'block';
      var zBlock = zVec.equals(yVec) ? yBlock : (zVec.equals(xVec) ? xBlock : blocks[await entity.world.getBlockType(zVec)].boundingBox == 'block');

      var old = entity.position.clone();

      if (xBlock || yBlock || zBlock) {
        entity.velocity.x = getFriction(entity.velocity.x, entity.friction.x, delta);
        entity.velocity.z = getFriction(entity.velocity.x, entity.friction.x, delta);
      }

      //console.log('afterfric',entity.velocity);

      var oldPos = entity.position.clone();

      entity.position.x += getMoveAmount('x', xBlock, entity, delta, sizeSigned.x);
      entity.position.y += getMoveAmount('y', yBlock, entity, delta, sizeSigned.y);
      entity.position.z += getMoveAmount('z', zBlock, entity, delta, sizeSigned.z);

      //console.log(entity.position, old);

      serv.emitParticle(30, serv.overworld, entity.position.scaled(1/32), { size: vec3(0, 0, 0) });
      return { oldPos: oldPos, onGround: yBlock}
    }

    entity.sendPosition = ({oldPos,onGround}) => {
      var diff = entity.position.minus(oldPos);
      if(diff.abs().x>127 || diff.abs().y>127 || diff.abs().z>127) 
        serv._writeNearby('entity_teleport', {
          entityId: entity.id,
          x: entity.position.x,
          y: entity.position.y,
          z: entity.position.z,
          yaw: entity.yaw,
          pitch: entity.pitch,
          onGround: onGround
        });
      else serv._writeNearby('rel_entity_move', {
          entityId: entity.id,
          dX: diff.x,
          dY: diff.y,
          dZ: diff.z,
          onGround: onGround
        }, entity);
    }

    return entity;
  }

  serv.spawnObject = (type, world, position, {pitch=0,yaw=0,velocity=vec3(0,0,0),data=1,itemId,itemDamage=0}={}) => {
    var object = serv.initEntity('object', type, world, position.scaled(32).floored());
    object.data = data;
    object.velocity = velocity.scaled(32).floored();
    object.pitch = pitch;
    object.yaw = yaw;
    object.gravity = vec3(0, -20*32, 0);
    object.terminalvelocity = vec3(27*32, 27*32, 27*32);
    object.friction = vec3(10*32, 0, 10*32).floored();
    object.size = vec3(0.25*32, 0.25*32, 0.25*32); // Hardcoded, will be dependent on type!
    object.deathTime = 60*1000; // 60 seconds

    var scaledVelocity = object.velocity.scaled(8000/32/20).floored(); // from fixed-position/second to unit => 1/8000 blocks per tick

    serv._writeNearby('spawn_entity', {
      entityId: object.id,
      type: object.entityType,
      x: object.position.x,
      y: object.position.y,
      z: object.position.z,
      pitch: object.pitch,
      yaw: object.yaw,
      objectData: {
        intField: data,
        velocityX: scaledVelocity.x,
        velocityY: scaledVelocity.y,
        velocityZ: scaledVelocity.z
      }
    }, object);

    if (typeof itemId != 'undefined') {
      console.log(itemId, itemDamage);
      object.setMetadata([{
        "key": 10,
        "type": 5,
        "value": {
          blockId: itemId,
          itemDamage: itemDamage
        }
      }]);
    }
  }

  serv.spawnMob = (type, world, position, {pitch=0,yaw=0,headPitch=0,velocity=vec3(0,0,0),metadata=[]}={}) => {
    var mob = serv.initEntity('mob', type, world, position.scaled(32).floored());
    mob.velocity = velocity.scaled(32).floored();
    mob.pitch = pitch;
    mob.headPitch = headPitch;
    mob.yaw = yaw;
    mob.gravity = vec3(0, -20*32, 0);
    mob.terminalvelocity = vec3(27*32, 27*32, 27*32);
    mob.friction = vec3(10*32, 0, 10*32);
    mob.size = vec3(0.75, 1.75, 0.75);
    mob.metadata = metadata;

    var scaledVelocity = mob.velocity.scaled(8000/32/20).floored();

    serv._writeNearby('spawn_entity_living', {
      entityId: mob.id,
      type: mob.entityType,
      x: mob.position.x,
      y: mob.position.y,
      z: mob.position.z,
      yaw: mob.yaw,
      pitch: mob.pitch,
      headPitch: mob.headPitch,
      velocityX: scaledVelocity.x,
      velocityY: scaledVelocity.y,
      velocityZ: scaledVelocity.z,
      metadata: mob.metadata
    }, mob);
  }

  serv.on('tick', function(delta) {
    Promise.all(
      Object.keys(serv.entities).map(async (id) => {
        var entity = serv.entities[id];
        if (entity.deathTime && Date.now() - entity.bornTime >= entity.deathTime) {
          entity.destroy();
          return;
        }
        if (!entity.velocity || !entity.size) return;
        var oldPosAndOnGround = await entity.calculatePhysics(delta);
        if (entity.type == 'mob') entity.sendPosition(oldPosAndOnGround);
      })
    ).catch((err)=> setTimeout(() => {throw err;},0));
  });
  
  serv.destroyEntity = entity => {
    serv._writeNearby('entity_destroy', {
      entityIds: [entity.id]
    }, {
      position: entity.position,
      world: entity.world
    });
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