var Entity = require("../entity");
var Version = require("../version")
var Vec3 = require("vec3").Vec3;
var ItemStack = require("prismarine-item")(Version)
var entitiesByName=require("minecraft-data")(Version).entitiesByName;

var path = require('path');
var requireIndex = require('requireindex');
var plugins = requireIndex(path.join(__dirname,'..', 'plugins'));

module.exports.server=function(serv,options) {

  serv.initEntity = (type, entityType, world, position) => {
    serv.entityMaxId++;
    var entity = new Entity(serv.entityMaxId);

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
    object.friction = new Vec3(15*32, 0, 15*32);
    object.size = new Vec3(0.25*32, 0.25*32, 0.25*32); // Hardcoded, will be dependent on type!
    object.deathTime = 60*1000; // 60 seconds
    object.pickupTime = 200;
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
    mob.friction = new Vec3(15*32, 0, 15*32);
    mob.size = new Vec3(0.75, 1.75, 0.75);
    mob.health = 20;
    mob.metadata = metadata;

    mob.updateAndSpawn();
  };

  serv.destroyEntity = entity => {
    entity._writeOthersNearby('entity_destroy', {
      entityIds: [entity.id]
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
        } else if (entity.pickupTime && Date.now() - entity.bornTime >= entity.pickupTime) {
          var players = serv.getNearby({
            world: entity.world,
            position: entity.position,
            radius: 1.5*32 // Seems good for now
          });
          if (players.length) {
            players[0].collect(entity);
          }
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
      serv.spawnMob(id, player.world, player.position.scaled(1/32), {
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
      serv.spawnObject(id, player.world, player.position.scaled(1/32), {
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
      serv.spawnMob(entity.id, player.world, player.position.scaled(1/32), {
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

  entity.sendMetadata = (data) => {
    entity._writeOthersNearby('entity_metadata', {
      entityId: entity.id,
      metadata: data
    });
  };

  entity.setAndUpdateMetadata = (data) => {
    entity.metadata = data;
    entity.sendMetadata(data);
  }

  entity.destroy = () => {
    serv.destroyEntity(entity);
  };

  entity.getSpawnPacket = () => {
    var scaledVelocity = entity.velocity.scaled(8000/32/20).floored(); // from fixed-position/second to unit => 1/8000 blocks per tick
    if (entity.type == 'player') {
      return {
        entityId: entity.id,
        playerUUID: entity._client.uuid,
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

  entity.updateAndSpawn = () => {
    var updatedEntities=entity.getNearby();
    var entitiesToAdd=updatedEntities.filter(e => entity.nearbyEntities.indexOf(e)==-1);
    var entitiesToRemove=entity.nearbyEntities.filter(e => updatedEntities.indexOf(e)==-1);
    if (entity.type == 'player') {
      entity.despawnEntities(entitiesToRemove);
      entitiesToAdd.forEach(entity.spawnEntity);
    }
    entity.lastPositionPlayersUpdated=entity.position.clone();

    var playersToAdd = entitiesToAdd.filter(e => e.type == 'player');
    var playersToRemove = entitiesToRemove.filter(e => e.type == 'player');

    playersToRemove.forEach(p => p.despawnEntities([entity]));
    playersToRemove.forEach(p => p.nearbyEntities=p.getNearby());
    playersToAdd.forEach(p => p.spawnEntity(entity));
    playersToAdd.forEach(p => p.nearbyEntities=p.getNearby());

    entity.nearbyEntities=updatedEntities;
  };

  entity.collect = (collectEntity) => {
    if (entity.type != 'player'){
      serv.emit('error', 'Non-player entity (ttype ' + entity.type + ') cannot collect another entity')
      return;
    }
    
    // Add it to a stack already in the player's inventory if possible
    for(var item in entity.inventory.items()){
      if(item.type == collenctEntity.itemId){
        item.stackSize += 1
        collectEntity._writeOthersNearby('collect', {
          collectedEntityId: collectEntity.id,
          collectorEntityId: entity.id
        });
        entity.playSoundAtSelf('random.pop');
        collectEntity.destroy()
        return;
      }
    }
    
    // If we couldn't add it to a already existing stack, put it in a new stack if the inventory has room
    var emptySlot = entity.inventory.firstEmptyInventorySlot()
    if(emptySlot != null){
      collectEntity._writeOthersNearby('collect', {
        collectedEntityId: collectEntity.id,
        collectorEntityId: entity.id
      });
      entity.playSoundAtSelf('random.pop');
      
      var newItem =  new ItemStack(collectEntity.itemId, 1, collectEntity.damage)
      entity.inventory.updateSlot(emptySlot, newItem)
      collectEntity.destroy()
    }
  }

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