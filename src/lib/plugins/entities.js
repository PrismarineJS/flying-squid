var Entity=require("prismarine-entity");
var util = require('util');
var EventEmitter = require('events').EventEmitter;
util.inherits(Entity, EventEmitter);
var blocks=require("minecraft-data")(require("../version")).blocks;
var mobs=require("minecraft-data")(require("../version")).entitiesByName;
var vec3 = require("vec3");

var path = require('path');
var requireIndex = require('requireindex');
var plugins = requireIndex(path.join(__dirname,'..', 'plugins'));

module.exports.server=function(serv,options) {

  serv.initEntity = (type, entityType, world, position) => {
    serv.entityMaxId++;
    var entity = new Entity(serv.entityMaxId);
    EventEmitter.call(entity);

    Object.keys(plugins)
      .filter(pluginName => plugins[pluginName].entity!=undefined)
      .forEach(pluginName => plugins[pluginName].entity(serv, entity, options));

    entity.initEntity(type, entityType, world, position);

    serv.emit("newEntity",entity);

    return entity;
  };

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
    object.itemId = itemId;
    object.itemDamage = itemDamage;

    object.updateAndSpawn();
  };

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

    mob.updateAndSpawn();
  };

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
        if (!oldPosAndOnGround.oldPos.equals(vec3(0,0,0)))
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
};

module.exports.entity=function(serv,entity){

  entity.initEntity=(type, entityType, world, position)=>{
    entity.type = type;
    entity.spawnPacketName = '';
    entity.entityType = entityType;
    entity.world = world;
    entity.position = position;
    entity.lastPositionPlayersUpdated = entity.position.clone();
    entity.nearbyEntities = [];
    entity.viewDistance = 150;

    entity.bornTime = Date.now();
    serv.entities[entity.id] = entity;

    if (entity.type == 'player') entity.spawnPacketName = 'named_entity_spawn';
    else if (entity.type == 'object') entity.spawnPacketName = 'spawn_entity';
    else if (entity.type == 'mob') entity.spawnPacketName = 'spawn_entity_living';
  };


  entity.on("positionChanged",() => {
    if(entity.position.distanceTo(entity.lastPositionPlayersUpdated)>2*32)
      entity.updateAndSpawn();
  });

  entity.setMetadata = (data) => {
    serv._writeNearby('entity_metadata', {
      entityId: entity.id,
      metadata: data
    }, entity);
  };

  entity.destroy = () => {
    serv.destroyEntity(entity);
  };

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

    // Get block for each (x/y/z)Vec, check to avoid duplicate getBlockTypes
    var xBlock = blocks[await entity.world.getBlockType(xVec)].boundingBox == 'block';
    var yBlock = yVec.equals(xVec) ? xBlock : blocks[await entity.world.getBlockType(yVec)].boundingBox == 'block';
    var zBlock = zVec.equals(yVec) ? yBlock : (zVec.equals(xVec) ? xBlock : blocks[await entity.world.getBlockType(zVec)].boundingBox == 'block');

    var old = entity.position.clone();

    if (xBlock || yBlock || zBlock) {
      entity.velocity.x = getFriction(entity.velocity.x, entity.friction.x, delta);
      entity.velocity.z = getFriction(entity.velocity.x, entity.friction.x, delta);
    }

    var oldPos = entity.position.clone();

    entity.position.x += getMoveAmount('x', xBlock, entity, delta, sizeSigned.x);
    entity.position.y += getMoveAmount('y', yBlock, entity, delta, sizeSigned.y);
    entity.position.z += getMoveAmount('z', zBlock, entity, delta, sizeSigned.z);

    //serv.emitParticle(30, serv.overworld, entity.position.scaled(1/32), { size: vec3(0, 0, 0) });
    return { oldPos: oldPos, onGround: yBlock}
  };

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
      }, entity);
    else serv._writeNearby('rel_entity_move', {
      entityId: entity.id,
      dX: diff.x,
      dY: diff.y,
      dZ: diff.z,
      onGround: onGround
    }, entity);

    entity.emit('positionChanged', oldPos);
  };

  entity.getSpawnPacket = () => {
    var scaledVelocity = entity.velocity.scaled(8000/32/20).floored(); // from fixed-position/second to unit => 1/8000 blocks per tick
    if (entity.type == 'player') {
      return {
        entityId: entity.id,
        playerUUID: entity.player._client.uuid,
        x: entity.position.x,
        y: entity.position.y,
        z: entity.position.z,
        yaw: entity.yaw,
        pitch: entity.pitch,
        currentItem: 0,
        metadata: entity.metadata
      }
    } else if (entity.type == 'object') {
      return {
        entityId: entity.id,
        type: entity.entityType,
        x: entity.position.x,
        y: entity.position.y,
        z: entity.position.z,
        pitch: entity.pitch,
        yaw: entity.yaw,
        objectData: {
          intField: entity.data,
          velocityX: scaledVelocity.x,
          velocityY: scaledVelocity.y,
          velocityZ: scaledVelocity.z
        }
      }
    } else if (entity.type == 'mob') {
      return {
        entityId: entity.id,
        type: entity.entityType,
        x: entity.position.x,
        y: entity.position.y,
        z: entity.position.z,
        yaw: entity.yaw,
        pitch: entity.pitch,
        headPitch: entity.headPitch,
        velocityX: scaledVelocity.x,
        velocityY: scaledVelocity.y,
        velocityZ: scaledVelocity.z,
        metadata: entity.metadata
      }
    }
  };

  entity.getNearby = () => serv
    .getNearbyEntities({
      world: entity.world,
      position: entity.position,
      radius: entity.viewDistance*32
    })
    .filter((e) => e != entity);

  entity.updateAndSpawn = () => {
    var updatedEntities=entity.getNearby();
    var entitiesToAdd=updatedEntities.filter(e => entity.nearbyEntities.indexOf(e)==-1);
    var entitiesToRemove=entity.nearbyEntities.filter(e => updatedEntities.indexOf(e)==-1);
    if (entity.type == 'player') {
      entity.player.despawnEntities(entitiesToRemove);
      entitiesToAdd.forEach(entity.player.spawnEntity);
      entity.player.lastPositionPlayersUpdated=entity.position.clone();
    } else {
      entity.lastPositionPlayersUpdated=entity.position.clone();
    }

    var playersToAdd = entitiesToAdd.filter(e => e.type == 'player').map(e => e.player);
    var playersToRemove = entitiesToRemove.filter(e => e.type == 'player').map(e => e.player);

    playersToRemove.forEach(p => p.despawnEntities([entity]));
    playersToRemove.forEach(p => p.entity.nearbyEntities=p.entity.getNearby());
    playersToAdd.forEach(p => p.spawnEntity(entity));
    playersToAdd.forEach(p => p.entity.nearbyEntities=p.entity.getNearby());

    entity.nearbyEntities=updatedEntities;
  };


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
};