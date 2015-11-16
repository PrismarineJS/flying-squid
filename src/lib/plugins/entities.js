var Entity=require("prismarine-entity");
var util = require('util');
var EventEmitter = require('events').EventEmitter;
util.inherits(Entity, EventEmitter);
var Vec3 = require("vec3").Vec3;
var entitiesByName=require("minecraft-data")(require("../version")).entitiesByName;

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
      .forEach(pluginName => plugins[pluginName].entity(entity, serv, options));

    entity.initEntity(type, entityType, world, position);

    serv.emit("newEntity",entity);

    return entity;
  };

  serv.spawnObject = (type, world, position, {pitch=0,yaw=0,velocity=new Vec3(0,0,0),data=1,itemId,itemDamage=0}={}) => {
    var object = serv.initEntity('object', type, world, position.scaled(32).floored());
    object.data = data;
    object.velocity = velocity.scaled(32).floored();
    object.pitch = pitch;
    object.yaw = yaw;
    object.gravity = new Vec3(0, -20*32, 0);
    object.terminalvelocity = new Vec3(27*32, 27*32, 27*32);
    object.friction = (new Vec3(10*32, 0, 10*32)).floored();
    object.size = new Vec3(0.25*32, 0.25*32, 0.25*32); // Hardcoded, will be dependent on type!
    object.deathTime = 60*1000; // 60 seconds
    object.itemId = itemId;
    object.itemDamage = itemDamage;

    object.updateAndSpawn();
  };

  serv.spawnMob = (type, world, position, {pitch=0,yaw=0,headPitch=0,velocity=new Vec3(0,0,0),metadata=[]}={}) => {
    var mob = serv.initEntity('mob', type, world, position.scaled(32).floored());
    mob.velocity = velocity.scaled(32).floored();
    mob.pitch = pitch;
    mob.headPitch = headPitch;
    mob.yaw = yaw;
    mob.gravity = new Vec3(0, -20*32, 0);
    mob.terminalvelocity = new Vec3(27*32, 27*32, 27*32);
    mob.friction = new Vec3(10*32, 0, 10*32);
    mob.size = new Vec3(0.75, 1.75, 0.75);
    mob.metadata = metadata;

    mob.updateAndSpawn();
  };

  serv.destroyEntity = entity => {
    serv._writeNearby('entity_destroy', {
      entityIds: [entity.id]
    }, {
      position: entity.position,
      world: entity.world
    });
    delete serv.entities[entity.id];
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
        if (!oldPosAndOnGround.oldPos.equals(new Vec3(0,0,0)))
          if (entity.type == 'mob') entity.sendPosition(oldPosAndOnGround);
      })
    ).catch((err)=> setTimeout(() => {throw err;},0));
  });
};

module.exports.player=function(player,serv){
  player.commands.add({
    base: 'spawn',
    info: 'Spawn a mob',
    usage: '/spawn <entity_id>',
    parse(str) {
      var results=str.match(/(\d+)/);
      if (!results) return false;
      return {
        id: parseInt(results[1])
      }
    },
    action({id}) {
      serv.spawnMob(id, player.world, player.entity.position.scaled(1/32), {
        velocity: Vec3((Math.random() - 0.5) * 10, Math.random()*10 + 10, (Math.random() - 0.5) * 10)
      });
    }
  });

  player.commands.add({
    base: 'spawnObject',
    info: 'Spawn an object',
    usage: '/spawnObject <entity_id>',
    parse(str) {
      var results=str.match(/(\d+)/);
      if (!results) return false;
      return {
        id: parseInt(results[1])
      }
    },
    action({id}) {
      serv.spawnObject(id, player.world, player.entity.position.scaled(1/32), {
        velocity: Vec3((Math.random() - 0.5) * 10, Math.random()*10 + 10, (Math.random() - 0.5) * 10)
      });
    }
  });

  player.commands.add({
    base: 'summon',
    info: 'Summon an entity',
    usage: '/summon <entity_name>',
    action(name) {
      var entity=entitiesByName[name];
      if(!entity) {
        player.chat("No entity named "+name);
        return;
      }
      serv.spawnMob(entity.id, player.world, player.entity.position.scaled(1/32), {
        velocity: Vec3((Math.random() - 0.5) * 10, Math.random()*10 + 10, (Math.random() - 0.5) * 10)
      });
    }
  });
};

module.exports.entity=function(entity,serv){

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
};